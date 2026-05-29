import { createClient } from '@/lib/supabase/server'

export type LeadStage = 'abandoned' | 'simulated' | 'in_contracting' | 'contracted'

export interface LeadRow {
  id: string
  clientName: string
  product: string
  stage: LeadStage
  desiredAmount: number
  origin: string
  createdAt: string
}

export interface ClientsFilters {
  stage?: string
  product?: string
  from?: string
  to?: string
}

export async function listLeads(filters: ClientsFilters = {}): Promise<LeadRow[]> {
  const supabase = await createClient()

  const { data: sims, error: simsError } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      status,
      desired_amount,
      created_at,
      seller_id,
      products ( name )
    `)
    .order('created_at', { ascending: false })

  if (simsError) throw simsError

  const simulations = sims ?? []

  const { data: proposals, error: proposalsError } = await supabase
    .from('proposals')
    .select('id, status, simulation_id')
    .in(
      'simulation_id',
      simulations.map((s) => s.id),
    )

  if (proposalsError) throw proposalsError

  const proposalsBySimId = new Map<string, Array<{ id: string; status: string }>>()
  for (const p of proposals ?? []) {
    if (!p.simulation_id) continue
    const existing = proposalsBySimId.get(p.simulation_id) ?? []
    existing.push({ id: p.id, status: p.status })
    proposalsBySimId.set(p.simulation_id, existing)
  }

  const rows: LeadRow[] = simulations.map((sim) => {
    const productName = (sim.products as { name: string } | null)?.name ?? '—'
    const simProposals = proposalsBySimId.get(sim.id) ?? []

    let stage: LeadStage = 'abandoned'
    if (simProposals.some((p) => p.status === 'aprovada')) {
      stage = 'contracted'
    } else if (
      simProposals.some((p) =>
        ['em_analise', 'pre_aprovada', 'necessita_detalhes'].includes(p.status),
      )
    ) {
      stage = 'in_contracting'
    } else if (sim.status === 'pre_qualificado' && simProposals.length === 0) {
      stage = 'simulated'
    }

    return {
      id: sim.id,
      clientName: sim.client_name,
      product: productName,
      stage,
      desiredAmount: Number(sim.desired_amount),
      origin: sim.seller_id ? 'Vendedor' : 'Loja própria',
      createdAt: sim.created_at,
    }
  })

  let filtered = rows

  if (filters.stage) {
    filtered = filtered.filter((r) => r.stage === filters.stage)
  }
  if (filters.product) {
    filtered = filtered.filter((r) => r.product === filters.product)
  }
  if (filters.from) {
    filtered = filtered.filter((r) => r.createdAt >= filters.from!)
  }
  if (filters.to) {
    filtered = filtered.filter((r) => r.createdAt <= filters.to! + 'T23:59:59Z')
  }

  return filtered
}

export async function getClientsKpis(filters: ClientsFilters = {}): Promise<{
  total: number
  abandoned: number
  inContracting: number
  contracted: number
}> {
  const leads = await listLeads(filters)
  return {
    total: leads.length,
    abandoned: leads.filter((l) => l.stage === 'abandoned').length,
    inContracting: leads.filter((l) => l.stage === 'in_contracting').length,
    contracted: leads.filter((l) => l.stage === 'contracted').length,
  }
}

export async function listProducts(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').order('name')
  return (data ?? []).map((p) => p.name)
}

import { createClient } from '@/lib/supabase/server'

export interface LeadOriginRow {
  origem: string
  leads: number
  convertidos: number
  taxaConversao: number
  volumeSolicitado: number
}

export interface LeadOriginFilters {
  produto?: string
  de?: string
  ate?: string
}

export interface LeadOriginKpis {
  totalLeads: number
  lojaPropriaLeads: number
  vendedoresLeads: number
}

export async function getLeadOriginData(
  filters: LeadOriginFilters = {},
): Promise<LeadOriginRow[]> {
  const supabase = await createClient()

  let simsQuery = supabase
    .from('simulations')
    .select('id, seller_id, desired_amount, created_at, products ( name )')

  if (filters.de) simsQuery = simsQuery.gte('created_at', filters.de)
  if (filters.ate) simsQuery = simsQuery.lte('created_at', filters.ate + 'T23:59:59Z')

  const { data: simsData, error: simsError } = await simsQuery
  if (simsError) throw simsError

  const sims = (simsData ?? []).filter((s) => {
    if (!filters.produto) return true
    const product = Array.isArray(s.products) ? s.products[0] : s.products
    return (product as { name: string } | null)?.name === filters.produto
  })

  const simIds = sims.map((s) => s.id)

  const { data: propsData, error: propsError } = await supabase
    .from('proposals')
    .select('id, simulation_id')
    .in('simulation_id', simIds.length > 0 ? simIds : ['00000000-0000-0000-0000-000000000000'])

  if (propsError) throw propsError

  const proposalSimIds = new Set((propsData ?? []).map((p) => p.simulation_id).filter(Boolean))

  const map = new Map<string, { leads: number; convertidos: number; volume: number }>()

  for (const sim of sims) {
    const origem = sim.seller_id ? 'Vendedor' : 'Loja própria'
    const entry = map.get(origem) ?? { leads: 0, convertidos: 0, volume: 0 }
    entry.leads++
    entry.volume += Number(sim.desired_amount)
    if (proposalSimIds.has(sim.id)) entry.convertidos++
    map.set(origem, entry)
  }

  return Array.from(map.entries())
    .map(([origem, { leads, convertidos, volume }]) => ({
      origem,
      leads,
      convertidos,
      taxaConversao: leads === 0 ? 0 : Math.round((convertidos / leads) * 1000) / 10,
      volumeSolicitado: volume,
    }))
    .sort((a, b) => b.leads - a.leads)
}

export async function getLeadOriginKpis(
  filters: LeadOriginFilters = {},
): Promise<LeadOriginKpis> {
  const rows = await getLeadOriginData(filters)
  const totalLeads = rows.reduce((s, r) => s + r.leads, 0)
  const lojaPropriaLeads = rows.find((r) => r.origem === 'Loja própria')?.leads ?? 0
  const vendedoresLeads = rows.find((r) => r.origem === 'Vendedor')?.leads ?? 0
  return { totalLeads, lojaPropriaLeads, vendedoresLeads }
}

export async function listLeadOriginProducts(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').order('name')
  return (data ?? []).map((p) => p.name)
}

export type LeadOriginData = Awaited<ReturnType<typeof getLeadOriginData>>

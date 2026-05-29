import { createClient } from '@/lib/supabase/server'

export interface SalesOriginRow {
  origem: string
  propostasAprovadas: number
  volumeContratado: number
  comissaoGerada: number
}

export interface SalesOriginFilters {
  produto?: string
  de?: string
  ate?: string
}

export interface SalesOriginKpis {
  totalAprovadas: number
  lojaPropriaAprovadas: number
  vendedoresAprovadas: number
}

export async function getSalesOriginData(
  filters: SalesOriginFilters = {},
): Promise<SalesOriginRow[]> {
  const supabase = await createClient()

  let propsQuery = supabase
    .from('proposals')
    .select(`
      id,
      simulations ( id, seller_id, desired_amount, products ( name ) )
    `)
    .eq('status', 'aprovada')

  if (filters.de) propsQuery = propsQuery.gte('updated_at', filters.de)
  if (filters.ate) propsQuery = propsQuery.lte('updated_at', filters.ate + 'T23:59:59Z')

  const { data: propsData, error: propsError } = await propsQuery
  if (propsError) throw propsError

  const proposals = (propsData ?? []).filter((p) => {
    if (!filters.produto) return true
    const sim = Array.isArray(p.simulations) ? p.simulations[0] : p.simulations
    const product = sim
      ? Array.isArray(sim.products)
        ? sim.products[0]
        : sim.products
      : null
    return (product as { name: string } | null)?.name === filters.produto
  })

  const propIds = proposals.map((p) => p.id)

  const { data: snapsData, error: snapsError } = await supabase
    .from('commission_snapshots')
    .select('proposal_id, tenant_commission_amount')
    .in('proposal_id', propIds.length > 0 ? propIds : ['00000000-0000-0000-0000-000000000000'])

  if (snapsError) throw snapsError

  const commissionByProposal = new Map<string, number>()
  for (const snap of snapsData ?? []) {
    if (!snap.proposal_id) continue
    commissionByProposal.set(
      snap.proposal_id,
      (commissionByProposal.get(snap.proposal_id) ?? 0) + Number(snap.tenant_commission_amount),
    )
  }

  const map = new Map<string, { count: number; volume: number; comissao: number }>()

  for (const prop of proposals) {
    const sim = Array.isArray(prop.simulations) ? prop.simulations[0] : prop.simulations
    const origem = sim?.seller_id ? 'Vendedor' : 'Loja própria'
    const entry = map.get(origem) ?? { count: 0, volume: 0, comissao: 0 }
    entry.count++
    entry.volume += sim ? Number(sim.desired_amount) : 0
    entry.comissao += commissionByProposal.get(prop.id) ?? 0
    map.set(origem, entry)
  }

  return Array.from(map.entries())
    .map(([origem, { count, volume, comissao }]) => ({
      origem,
      propostasAprovadas: count,
      volumeContratado: volume,
      comissaoGerada: comissao,
    }))
    .sort((a, b) => b.propostasAprovadas - a.propostasAprovadas)
}

export async function getSalesOriginKpis(
  filters: SalesOriginFilters = {},
): Promise<SalesOriginKpis> {
  const rows = await getSalesOriginData(filters)
  const totalAprovadas = rows.reduce((s, r) => s + r.propostasAprovadas, 0)
  const lojaPropriaAprovadas = rows.find((r) => r.origem === 'Loja própria')?.propostasAprovadas ?? 0
  const vendedoresAprovadas = rows.find((r) => r.origem === 'Vendedor')?.propostasAprovadas ?? 0
  return { totalAprovadas, lojaPropriaAprovadas, vendedoresAprovadas }
}

export async function listSalesOriginProducts(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').order('name')
  return (data ?? []).map((p) => p.name)
}

export type SalesOriginData = Awaited<ReturnType<typeof getSalesOriginData>>

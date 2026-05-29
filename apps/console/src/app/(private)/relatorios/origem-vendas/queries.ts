import { createClient } from '@/lib/supabase/server'

export interface SalesOriginRow {
  origin: string
  approvedProposals: number
  contractedVolume: number
  generatedCommission: number
}

export interface SalesOriginFilters {
  product?: string
  from?: string
  to?: string
}

export interface SalesOriginKpis {
  totalApproved: number
  ownStoreApproved: number
  sellerApproved: number
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

  if (filters.from) propsQuery = propsQuery.gte('updated_at', filters.from)
  if (filters.to) propsQuery = propsQuery.lte('updated_at', filters.to + 'T23:59:59Z')

  const { data: propsData, error: propsError } = await propsQuery
  if (propsError) throw propsError

  const proposals = (propsData ?? []).filter((p) => {
    if (!filters.product) return true
    const sim = Array.isArray(p.simulations) ? p.simulations[0] : p.simulations
    const product = sim
      ? Array.isArray(sim.products)
        ? sim.products[0]
        : sim.products
      : null
    return (product as { name: string } | null)?.name === filters.product
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

  const map = new Map<string, { count: number; volume: number; commission: number }>()

  for (const prop of proposals) {
    const sim = Array.isArray(prop.simulations) ? prop.simulations[0] : prop.simulations
    const origin = sim?.seller_id ? 'Vendedor' : 'Loja própria'
    const entry = map.get(origin) ?? { count: 0, volume: 0, commission: 0 }
    entry.count++
    entry.volume += sim ? Number(sim.desired_amount) : 0
    entry.commission += commissionByProposal.get(prop.id) ?? 0
    map.set(origin, entry)
  }

  return Array.from(map.entries())
    .map(([origin, { count, volume, commission }]) => ({
      origin,
      approvedProposals: count,
      contractedVolume: volume,
      generatedCommission: commission,
    }))
    .sort((a, b) => b.approvedProposals - a.approvedProposals)
}

export async function getSalesOriginKpis(
  filters: SalesOriginFilters = {},
): Promise<SalesOriginKpis> {
  const rows = await getSalesOriginData(filters)
  const totalApproved = rows.reduce((s, r) => s + r.approvedProposals, 0)
  const ownStoreApproved = rows.find((r) => r.origin === 'Loja própria')?.approvedProposals ?? 0
  const sellerApproved = rows.find((r) => r.origin === 'Vendedor')?.approvedProposals ?? 0
  return { totalApproved, ownStoreApproved, sellerApproved }
}

export async function listSalesOriginProducts(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').order('name')
  return (data ?? []).map((p) => p.name)
}

export type SalesOriginData = Awaited<ReturnType<typeof getSalesOriginData>>

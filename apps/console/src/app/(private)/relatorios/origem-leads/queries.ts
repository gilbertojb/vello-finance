import { createClient } from '@/lib/supabase/server'

export interface LeadOriginRow {
  origin: string
  leads: number
  converted: number
  conversionRate: number
  requestedVolume: number
}

export interface LeadOriginFilters {
  product?: string
  from?: string
  to?: string
}

export interface LeadOriginKpis {
  totalLeads: number
  ownStoreLeads: number
  sellerLeads: number
}

export async function getLeadOriginData(
  filters: LeadOriginFilters = {},
): Promise<LeadOriginRow[]> {
  const supabase = await createClient()

  let simsQuery = supabase
    .from('simulations')
    .select('id, seller_id, desired_amount, created_at, products ( name )')

  if (filters.from) simsQuery = simsQuery.gte('created_at', filters.from)
  if (filters.to) simsQuery = simsQuery.lte('created_at', filters.to + 'T23:59:59Z')

  const { data: simsData, error: simsError } = await simsQuery
  if (simsError) throw simsError

  const sims = (simsData ?? []).filter((s) => {
    if (!filters.product) return true
    const product = Array.isArray(s.products) ? s.products[0] : s.products
    return (product as { name: string } | null)?.name === filters.product
  })

  const simIds = sims.map((s) => s.id)

  const { data: propsData, error: propsError } = await supabase
    .from('proposals')
    .select('id, simulation_id')
    .in('simulation_id', simIds.length > 0 ? simIds : ['00000000-0000-0000-0000-000000000000'])

  if (propsError) throw propsError

  const proposalSimIds = new Set((propsData ?? []).map((p) => p.simulation_id).filter(Boolean))

  const map = new Map<string, { leads: number; converted: number; volume: number }>()

  for (const sim of sims) {
    const origin = sim.seller_id ? 'Vendedor' : 'Loja própria'
    const entry = map.get(origin) ?? { leads: 0, converted: 0, volume: 0 }
    entry.leads++
    entry.volume += Number(sim.desired_amount)
    if (proposalSimIds.has(sim.id)) entry.converted++
    map.set(origin, entry)
  }

  return Array.from(map.entries())
    .map(([origin, { leads, converted, volume }]) => ({
      origin,
      leads,
      converted,
      conversionRate: leads === 0 ? 0 : Math.round((converted / leads) * 1000) / 10,
      requestedVolume: volume,
    }))
    .sort((a, b) => b.leads - a.leads)
}

export async function getLeadOriginKpis(
  filters: LeadOriginFilters = {},
): Promise<LeadOriginKpis> {
  const rows = await getLeadOriginData(filters)
  const totalLeads = rows.reduce((s, r) => s + r.leads, 0)
  const ownStoreLeads = rows.find((r) => r.origin === 'Loja própria')?.leads ?? 0
  const sellerLeads = rows.find((r) => r.origin === 'Vendedor')?.leads ?? 0
  return { totalLeads, ownStoreLeads, sellerLeads }
}

export async function listLeadOriginProducts(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').order('name')
  return [...new Set((data ?? []).map((p) => p.name))]
}

export type LeadOriginData = Awaited<ReturnType<typeof getLeadOriginData>>

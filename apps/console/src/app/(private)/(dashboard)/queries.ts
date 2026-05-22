import { createClient } from '@/lib/supabase/server'

// ─── Date helpers ─────────────────────────────────────────────────────────────

function subDays(d: Date, n: number): Date {
  const result = new Date(d)
  result.setDate(result.getDate() - n)
  return result
}

function toISO(d: Date): string {
  return d.toISOString()
}

// Propostas que completaram o wizard (enviaram documentos)
const COMPLETED_STATUSES = ['em_analise', 'pre_aprovada', 'necessita_detalhes', 'reprovada', 'aprovada'] as const
const PIPELINE_STATUSES  = ['em_analise', 'pre_aprovada', 'necessita_detalhes'] as const

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getDashboardKpis(): Promise<{
  volumeContratado: number
  activeProposals: number
  sims30Count: number
  sims30Volume: number
  simsGrowth: number
  conversionRate: number
  disbursed: number
  disbursedGrowth: number
}> {
  const supabase = await createClient()
  const now = new Date()
  const d30 = toISO(subDays(now, 30))
  const d60 = toISO(subDays(now, 60))
  const d7  = toISO(subDays(now, 7))

  const [
    { data: activeProps },
    { data: sims30 },
    { data: simsPrev },
    { data: proposals30 },
    { data: approvedWeek },
    { data: approvedAll },
  ] = await Promise.all([
    supabase
      .from('proposals')
      .select('simulations ( desired_amount )')
      .in('status', [...PIPELINE_STATUSES]),
    supabase
      .from('simulations')
      .select('desired_amount, created_at')
      .gte('created_at', d30),
    supabase
      .from('simulations')
      .select('desired_amount, created_at')
      .gte('created_at', d60)
      .lt('created_at', d30),
    supabase
      .from('proposals')
      .select('id')
      .in('status', [...COMPLETED_STATUSES])
      .gte('created_at', d30),
    supabase
      .from('proposals')
      .select('simulations ( desired_amount )')
      .eq('status', 'aprovada')
      .gte('updated_at', d7),
    supabase
      .from('proposals')
      .select('simulations ( desired_amount )')
      .eq('status', 'aprovada'),
  ])

  const activeProposalsList = activeProps ?? []
  const sims30List          = sims30 ?? []
  const simsPrevList        = simsPrev ?? []
  const proposals30List     = proposals30 ?? []
  const approvedWeekList    = approvedWeek ?? []
  const approvedAllList     = approvedAll ?? []

  function proposalAmount(p: { simulations: { desired_amount: number } | { desired_amount: number }[] | null }): number {
    const sim = Array.isArray(p.simulations) ? p.simulations[0] : p.simulations
    return sim ? Number(sim.desired_amount) : 0
  }

  const volumeContratado = activeProposalsList.reduce((sum, p) => sum + proposalAmount(p), 0)
  const activeProposals  = activeProposalsList.length
  const sims30Count      = sims30List.length
  const sims30Volume     = sims30List.reduce((sum, s) => sum + Number(s.desired_amount), 0)

  const prevCount  = simsPrevList.length
  const simsGrowth = prevCount === 0 ? 0 : Math.round(((sims30Count - prevCount) / prevCount) * 100)

  const conversionRate =
    sims30Count === 0 ? 0 : Math.round((proposals30List.length / sims30Count) * 1000) / 10

  const disbursed      = approvedWeekList.reduce((sum, p) => sum + proposalAmount(p), 0)
  const totalApproved  = approvedAllList.reduce((sum, p) => sum + proposalAmount(p), 0)
  const disbursedGrowth = totalApproved === 0 ? 0 : Math.round((disbursed / totalApproved) * 1000) / 10

  return {
    volumeContratado,
    activeProposals,
    sims30Count,
    sims30Volume,
    simsGrowth,
    conversionRate,
    disbursed,
    disbursedGrowth,
  }
}

export type DashboardKpis = Awaited<ReturnType<typeof getDashboardKpis>>

// ─── Trend Data ───────────────────────────────────────────────────────────────

export async function getTrendData(): Promise<
  Array<{
    date: string
    label: string
    simulations: number
    proposals: number
  }>
> {
  const supabase = await createClient()
  const now = new Date()
  const d30 = toISO(subDays(now, 30))

  const [{ data: sims }, { data: props }] = await Promise.all([
    supabase.from('simulations').select('created_at').gte('created_at', d30),
    supabase
      .from('proposals')
      .select('created_at')
      .in('status', [...COMPLETED_STATUSES])
      .gte('created_at', d30),
  ])

  const days: Array<{ date: string; label: string; simulations: number; proposals: number }> = []
  for (let i = 29; i >= 0; i--) {
    const d     = subDays(now, i)
    const dateStr = d.toISOString().slice(0, 10)
    const dd    = String(d.getDate()).padStart(2, '0')
    const mm    = String(d.getMonth() + 1).padStart(2, '0')
    days.push({ date: dateStr, label: `${dd}/${mm}`, simulations: 0, proposals: 0 })
  }

  const dayMap = new Map(days.map((d) => [d.date, d]))

  for (const s of sims ?? []) {
    const entry = dayMap.get(s.created_at.slice(0, 10))
    if (entry) entry.simulations++
  }
  for (const p of props ?? []) {
    const entry = dayMap.get(p.created_at.slice(0, 10))
    if (entry) entry.proposals++
  }

  return days
}

export type TrendData = Awaited<ReturnType<typeof getTrendData>>

// ─── Pipeline Distribution ────────────────────────────────────────────────────

export async function getPipelineData(): Promise<
  Array<{
    status: string
    label: string
    color: string
    count: number
    percentage: number
  }>
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proposals')
    .select('status')
    .in('status', [...COMPLETED_STATUSES])

  const proposals = data ?? []
  const total     = proposals.length

  const STATUS_META: Record<string, { label: string; color: string }> = {
    em_analise:         { label: 'Em análise',     color: '#6366F1' },
    pre_aprovada:       { label: 'Pré-aprovada',   color: '#10B981' },
    necessita_detalhes: { label: 'Det. pendentes', color: '#F59E0B' },
    reprovada:          { label: 'Reprovada',       color: '#EF4444' },
    aprovada:           { label: 'Aprovada',        color: '#22C55E' },
  }

  const counts: Record<string, number> = {}
  for (const p of proposals) {
    counts[p.status] = (counts[p.status] ?? 0) + 1
  }

  return Object.entries(STATUS_META)
    .map(([status, meta]) => ({
      status,
      label:      meta.label,
      color:      meta.color,
      count:      counts[status] ?? 0,
      percentage: total === 0 ? 0 : Math.round(((counts[status] ?? 0) / total) * 100),
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
}

export type PipelineData = Awaited<ReturnType<typeof getPipelineData>>

// ─── Product Volume ───────────────────────────────────────────────────────────

export async function getProductVolume(): Promise<
  Array<{
    name: string
    count: number
    volume: number
    percentage: number
  }>
> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('proposals')
    .select('products ( name ), simulations ( desired_amount )')
    .in('status', [...COMPLETED_STATUSES])

  const proposals = data ?? []
  const map       = new Map<string, { count: number; volume: number }>()

  for (const p of proposals) {
    const productData = p.products
    const name =
      Array.isArray(productData)
        ? (productData[0] as { name: string } | undefined)?.name ?? 'Sem produto'
        : (productData as { name: string } | null)?.name ?? 'Sem produto'

    const simData  = Array.isArray(p.simulations) ? p.simulations[0] : p.simulations
    const amount   = simData ? Number(simData.desired_amount) : 0

    const entry = map.get(name) ?? { count: 0, volume: 0 }
    entry.count++
    entry.volume += amount
    map.set(name, entry)
  }

  const items = Array.from(map.entries())
    .map(([name, { count, volume }]) => ({ name, count, volume, percentage: 0 }))
    .sort((a, b) => b.volume - a.volume)
    .slice(0, 7)

  const maxVolume = items[0]?.volume ?? 1
  return items.map((item) => ({
    ...item,
    percentage: Math.round((item.volume / maxVolume) * 100),
  }))
}

export type ProductVolume = Awaited<ReturnType<typeof getProductVolume>>

// ─── Funnel Data ──────────────────────────────────────────────────────────────

export async function getFunnelData(): Promise<
  Array<{
    label: string
    count: number
    percentage: number
  }>
> {
  const supabase = await createClient()

  const [{ data: sims }, { data: props }] = await Promise.all([
    supabase.from('simulations').select('status'),
    supabase.from('proposals').select('status').in('status', [...COMPLETED_STATUSES]),
  ])

  const simulations = sims ?? []
  const proposals   = props ?? []

  const totalSims  = simulations.length
  const qualified  = simulations.filter((s) => s.status === 'pre_qualificado').length
  const totalProps = proposals.length
  const approved   = proposals.filter((p) => p.status === 'aprovada').length

  const base = totalSims || 1

  return [
    { label: 'Simulações',   count: totalSims,  percentage: 100 },
    { label: 'Qualificadas', count: qualified,  percentage: Math.round((qualified  / base) * 100) },
    { label: 'Propostas',    count: totalProps, percentage: Math.round((totalProps / base) * 100) },
    { label: 'Pagas',        count: approved,   percentage: Math.round((approved   / base) * 100) },
  ]
}

export type FunnelData = Awaited<ReturnType<typeof getFunnelData>>

// ─── Recent Activity ──────────────────────────────────────────────────────────

export async function getRecentActivity(): Promise<
  Array<{
    id: string
    client_name: string
    action: string
    product: string
    time: string
    type: 'simulation' | 'proposal'
    status: string
  }>
> {
  const supabase = await createClient()

  const [{ data: sims }, { data: props }] = await Promise.all([
    supabase
      .from('simulations')
      .select('id, client_name, status, created_at, products ( name )')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('proposals')
      .select('id, client_name, status, created_at, products ( name )')
      .in('status', [...COMPLETED_STATUSES])
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const ACTION_MAP: Record<string, string> = {
    'sim:rascunho':              'simulou',
    'sim:pre_qualificado':       'qualificou simulação',
    'prop:em_analise':           'enviou proposta',
    'prop:pre_aprovada':         'proposta pré-aprovada',
    'prop:necessita_detalhes':   'detalhes solicitados',
    'prop:reprovada':            'proposta reprovada',
    'prop:aprovada':             'proposta aprovada',
  }

  type ActivityItem = {
    id: string
    client_name: string
    action: string
    product: string
    time: string
    type: 'simulation' | 'proposal'
    status: string
  }

  function resolveProductName(productData: unknown): string {
    if (Array.isArray(productData)) return (productData[0] as { name: string } | undefined)?.name ?? '—'
    return (productData as { name: string } | null)?.name ?? '—'
  }

  const simItems: ActivityItem[] = (sims ?? []).map((s) => ({
    id:          `sim-${s.id}`,
    client_name: s.client_name,
    action:      ACTION_MAP[`sim:${s.status}`] ?? s.status,
    product:     resolveProductName(s.products),
    time:        s.created_at,
    type:        'simulation',
    status:      s.status,
  }))

  const propItems: ActivityItem[] = (props ?? []).map((p) => ({
    id:          `prop-${p.id}`,
    client_name: p.client_name ?? 'Cliente',
    action:      ACTION_MAP[`prop:${p.status}`] ?? p.status,
    product:     resolveProductName(p.products),
    time:        p.created_at,
    type:        'proposal',
    status:      p.status,
  }))

  return [...simItems, ...propItems]
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 10)
}

export type RecentActivity = Awaited<ReturnType<typeof getRecentActivity>>

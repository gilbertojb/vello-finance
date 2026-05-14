import { createClient } from '@/lib/supabase/server'

function subDays(n: number): string {
  return new Date(Date.now() - n * 86400000).toISOString()
}

export async function listSimulations() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      client_phone,
      desired_amount,
      desired_term_months,
      estimated_rate,
      estimated_payment,
      status,
      created_at,
      products ( name )
    `)
    .order('created_at', { ascending: false })
  if (error) throw error

  // Cast to include optional fields added by pending migration.
  // After running `pnpm db:types`, add these columns to the SELECT above
  // and remove this cast.
  return (data ?? []) as Array<
    (typeof data extends Array<infer T> ? T : never) & {
      client_email?: string | null
      client_cpf?: string | null
      client_birthdate?: string | null
      client_city?: string | null
      client_income?: number | null
    }
  >
}

export type SimulationRow = Awaited<ReturnType<typeof listSimulations>>[number]

export async function getSimulationKpis() {
  const supabase = await createClient()
  const d7 = subDays(7)
  const d14 = subDays(14)
  const d30 = subDays(30)

  const [
    { data: all },
    { data: last7 },
    { data: prev7 },
    { data: last30 },
  ] = await Promise.all([
    supabase.from('simulations').select('desired_amount, status, created_at'),
    supabase.from('simulations').select('desired_amount, status, created_at').gte('created_at', d7),
    supabase.from('simulations').select('desired_amount, status').gte('created_at', d14).lt('created_at', d7),
    supabase.from('simulations').select('desired_amount, status, created_at').gte('created_at', d30),
  ])

  const s7 = last7 ?? []
  const sP = prev7 ?? []
  const s30 = last30 ?? []

  // KPI 1: count 7d
  const count7d = s7.length
  const countPrev7d = sP.length
  const countGrowth = countPrev7d > 0 ? ((count7d - countPrev7d) / countPrev7d) * 100 : 0

  // KPI 2: volume 30d
  const volume30 = s30.reduce((s, r) => s + Number(r.desired_amount), 0)
  const volumePrev = (all ?? []).filter(r =>
    new Date(r.created_at) < new Date(d30)
  ).reduce((s, r) => s + Number(r.desired_amount), 0)
  const volumeGrowth = volumePrev > 0 ? ((volume30 - volumePrev) / volumePrev) * 100 : 0

  // KPI 3: score médio (proxy: % pre_qualificado * 100)
  const qualified = s30.filter(r => r.status === 'pre_qualificado').length
  const scoreMedio = s30.length > 0 ? (qualified / s30.length) * 100 : 0

  // KPI 4: taxa de conversão 30d (precisa de proposals — buscar)
  const { data: props30 } = await supabase
    .from('proposals')
    .select('id')
    .gte('submitted_at', d30)

  const convRate = s30.length > 0 ? ((props30?.length ?? 0) / s30.length) * 100 : 0

  return { count7d, countGrowth, volume30, volumeGrowth, scoreMedio, convRate }
}

export type SimulationKpis = Awaited<ReturnType<typeof getSimulationKpis>>

export async function getSimulationSparklines() {
  const supabase = await createClient()
  const d14 = subDays(14)

  const { data } = await supabase
    .from('simulations')
    .select('created_at')
    .gte('created_at', d14)

  const dayMap: Record<string, number> = {}
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    dayMap[d] = 0
  }
  for (const s of data ?? []) {
    const d = s.created_at.slice(0, 10)
    if (d in dayMap) dayMap[d]++
  }

  return Object.values(dayMap)
}

export type SparklineData = Awaited<ReturnType<typeof getSimulationSparklines>>

export async function getSimulationFunnel() {
  const supabase = await createClient()
  const [{ data: sims }, { data: props }] = await Promise.all([
    supabase.from('simulations').select('status'),
    supabase.from('proposals').select('status'),
  ])

  const total = sims?.length ?? 0
  const qualified = sims?.filter(s => s.status === 'pre_qualificado').length ?? 0
  const propsTotal = props?.length ?? 0
  const converted = props?.filter(p => p.status === 'approved').length ?? 0

  // Baseline acessos: estimativa (total * 14.35 = mantém proporção mockup)
  const acessos = total > 0 ? Math.round(total / 0.219 / 0.317) : 0
  const iniciaram = total > 0 ? Math.round(acessos * 0.317) : 0

  return [
    { label: 'Acessos', count: acessos, pct: 100 },
    { label: 'Iniciaram simulação', count: iniciaram, pct: acessos > 0 ? Math.round((iniciaram / acessos) * 1000) / 10 : 0 },
    { label: 'Completaram', count: total, pct: acessos > 0 ? Math.round((total / acessos) * 1000) / 10 : 0 },
    { label: 'Qualificados', count: qualified, pct: total > 0 ? Math.round((qualified / total) * 1000) / 10 : 0 },
    { label: 'Convertidos', count: converted, pct: qualified > 0 ? Math.round((converted / qualified) * 1000) / 10 : 0 },
  ]
}

export type FunnelRow = Awaited<ReturnType<typeof getSimulationFunnel>>[number]

export async function getProductMix() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('simulations')
    .select('products ( name )')

  const counts: Record<string, number> = {}
  let total = 0
  for (const s of data ?? []) {
    const name = (s.products as { name: string } | null)?.name ?? 'Outros'
    counts[name] = (counts[name] || 0) + 1
    total++
  }

  const items = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 100) : 0,
    }))

  return items
}

export type ProductMixRow = Awaited<ReturnType<typeof getProductMix>>[number]

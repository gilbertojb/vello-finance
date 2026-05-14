import { createClient } from '@/lib/supabase/server'

export async function getDashboardStats() {
  const supabase = await createClient()

  const [{ data: sims }, { data: props }] = await Promise.all([
    supabase.from('simulations').select('status, desired_amount'),
    supabase.from('proposals').select('status, desired_amount'),
  ])

  const simulations = sims ?? []
  const proposals   = props ?? []

  return {
    simulations: {
      total:        simulations.length,
      preQualified: simulations.filter((s) => s.status === 'pre_qualificado').length,
      volumeTotal:  simulations.reduce((sum, s) => sum + Number(s.desired_amount), 0),
    },
    proposals: {
      total:          proposals.length,
      inPipeline:     proposals.filter((p) => p.status === 'in_pipeline').length,
      approved:       proposals.filter((p) => p.status === 'approved').length,
      rejected:       proposals.filter((p) => p.status === 'rejected').length,
      volumePipeline: proposals
        .filter((p) => p.status === 'in_pipeline')
        .reduce((sum, p) => sum + Number(p.desired_amount), 0),
    },
  }
}

export type DashboardStats = Awaited<ReturnType<typeof getDashboardStats>>

export async function getRecentSimulations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('simulations')
    .select('id, client_name, status, desired_amount, created_at, products ( name )')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data ?? []
}

export type RecentSimulation = Awaited<ReturnType<typeof getRecentSimulations>>[number]

export async function getRecentProposals() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proposals')
    .select('id, client_name, status, desired_amount, created_at, products ( name )')
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error
  return data ?? []
}

export type RecentProposal = Awaited<ReturnType<typeof getRecentProposals>>[number]

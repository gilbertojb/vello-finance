import { createClient } from '@/lib/supabase/server'

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

  return data ?? []
}

export type SimulationRow = Awaited<ReturnType<typeof listSimulations>>[number]

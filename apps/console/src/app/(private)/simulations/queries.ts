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

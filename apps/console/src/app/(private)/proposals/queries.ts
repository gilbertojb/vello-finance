import { createClient } from '@/lib/supabase/server'
import { COMPLETED_STATUSES } from './status-config'

export async function listProposals() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      product_type_slug,
      current_step,
      client_name,
      client_phone,
      documents_submitted,
      created_at,
      updated_at,
      products ( name ),
      simulations (
        client_name,
        client_phone,
        desired_amount,
        desired_term_months,
        estimated_rate,
        estimated_payment
      )
    `)
    .in('status', COMPLETED_STATUSES as unknown as string[])
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}

export type ProposalRow = Awaited<ReturnType<typeof listProposals>>[number]

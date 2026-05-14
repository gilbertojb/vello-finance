import { createClient } from '@/lib/supabase/server'

export async function listProposals() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      purpose,
      desired_amount,
      desired_term_months,
      estimated_rate,
      estimated_payment,
      client_name,
      client_email,
      client_phone,
      submitted_at,
      created_at,
      products ( name ),
      proposal_stages ( name, order_num )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}

export type ProposalRow = Awaited<ReturnType<typeof listProposals>>[number]

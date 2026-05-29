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

export async function getProposal(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      product_type_slug,
      form_data,
      client_name,
      client_phone,
      created_at,
      updated_at,
      products ( name ),
      simulations (
        desired_amount,
        desired_term_months,
        estimated_rate,
        estimated_payment
      ),
      proposal_documents (
        id,
        document_type,
        file_name,
        storage_path,
        created_at
      ),
      proposal_events (
        id,
        from_status,
        to_status,
        created_at
      ),
      proposal_comments (
        id,
        author_name,
        body,
        created_at
      )
    `)
    .eq('id', id)
    .order('created_at', { referencedTable: 'proposal_events', ascending: true })
    .order('created_at', { referencedTable: 'proposal_comments', ascending: true })
    .single()

  if (error) throw error
  return data
}

export type ProposalDetail = Awaited<ReturnType<typeof getProposal>>

export async function getTenantName(): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenants')
    .select('name')
    .maybeSingle()
  return data?.name ?? 'Loja'
}

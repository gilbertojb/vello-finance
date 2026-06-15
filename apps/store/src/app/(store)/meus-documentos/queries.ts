import { createServiceClient } from '@/lib/supabase/service'
import { getRequiredDocs } from '@vello/proposals-shared/required-documents'

export async function listClientProposals(tenantId: string, cpfHash: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      product_type_slug,
      client_name,
      products ( name ),
      proposal_documents ( document_type )
    `)
    .eq('tenant_id', tenantId)
    .eq('client_cpf_hash', cpfHash)
    .order('created_at', { ascending: false })

  const list = data ?? []
  return list.map((p) => {
    const required = getRequiredDocs(p.product_type_slug)
    const uploaded = new Set(
      Array.isArray(p.proposal_documents)
        ? p.proposal_documents.map((d) => d.document_type)
        : [],
    )
    const pendingCount = required.filter((r) => !uploaded.has(r.type)).length
    return {
      id: p.id,
      status: p.status,
      productName: (p.products as { name?: string } | null)?.name ?? '—',
      productTypeSlug: p.product_type_slug,
      pendingCount,
      clientName: p.client_name ?? null,
    }
  })
}

export async function getClientProposal(
  proposalId: string,
  tenantId: string,
  cpfHash: string,
) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('proposals')
    .select(`
      id,
      status,
      product_type_slug,
      client_name,
      products ( name ),
      proposal_documents ( id, document_type, file_name, storage_path, created_at )
    `)
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .eq('client_cpf_hash', cpfHash)
    .single()
  return data ?? null
}

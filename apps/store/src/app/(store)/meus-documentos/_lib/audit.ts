import { createServiceClient } from '@/lib/supabase/service'

type AuditAction = 'viewed_list' | 'viewed_proposal' | 'uploaded' | 'downloaded'

export async function logAccess(params: {
  tenantId: string
  proposalId: string
  action: AuditAction
  documentType?: string | null
  ipHash: string
  userAgentHash: string
}): Promise<void> {
  const supabase = createServiceClient()
  await supabase.from('proposal_document_access_log').insert({
    tenant_id: params.tenantId,
    proposal_id: params.proposalId,
    action: params.action,
    document_type: params.documentType ?? null,
    ip_hash: params.ipHash,
    user_agent_hash: params.userAgentHash,
  })
}

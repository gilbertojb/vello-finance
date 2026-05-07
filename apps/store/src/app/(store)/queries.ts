import { createServiceClient } from '@/lib/supabase/service'

export async function listActiveProducts(tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_products')
    .select(`
      id,
      cover_url,
      products (
        id,
        name,
        type,
        description,
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at')
  return data ?? []
}

export async function getTenantProduct(tenantProductId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_products')
    .select(`
      id,
      cover_url,
      products (
        id,
        name,
        type,
        description,
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly
      )
    `)
    .eq('id', tenantProductId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()
  return data
}

export async function getProposalConfirmation(proposalId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('proposals')
    .select(`
      id,
      client_name,
      desired_amount,
      desired_term_months,
      submitted_at,
      products ( name )
    `)
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

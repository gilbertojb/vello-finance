import { createServiceClient } from '@/lib/supabase/service'

export async function listActiveProducts(tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_products')
    .select(`
      id,
      cover_url,
      is_popular,
      products (
        id,
        name,
        description,
        category,
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly,
        product_type:product_types ( slug )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('is_popular', { ascending: false })
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
        description,
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly,
        product_type:product_types ( slug )
      )
    `)
    .eq('id', tenantProductId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()
  return data
}

export async function listActiveProductsByCategory(
  tenantId: string,
  category: 'pessoa_fisica' | 'pessoa_juridica' | 'financiamentos',
) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_products')
    .select(`
      id,
      cover_url,
      products (
        id,
        name,
        description,
        category,
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly,
        product_type:product_types ( slug )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('products.category', category)
    .order('created_at')
  return (data ?? []).filter((tp) => tp.products !== null && (tp.products as { category?: string }).category === category)
}

export async function getSimulation(simulationId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      product_id,
      desired_amount,
      desired_term_months,
      status,
      products (
        name,
        product_type:product_types ( slug )
      )
    `)
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export async function getTenantProductByProductId(productId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_products')
    .select('id')
    .eq('product_id', productId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()
  return data
}

export async function getSimulationForPdf(simulationId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      desired_amount,
      desired_term_months,
      estimated_rate,
      estimated_payment,
      simulation_data,
      created_at,
      products (
        name,
        product_type:product_types ( slug )
      )
    `)
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export async function getProposal(proposalId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('proposals')
    .select(`
      id,
      product_id,
      product_type_slug,
      simulation_id,
      status,
      current_step,
      client_name,
      client_phone,
      form_data,
      documents_submitted,
      created_at,
      products (
        id,
        name,
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly,
        product_type:product_types ( slug )
      )
    `)
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export type ProposalWithProduct = NonNullable<Awaited<ReturnType<typeof getProposal>>>

export type TenantProduct = NonNullable<Awaited<ReturnType<typeof getTenantProduct>>>

export async function getTenantBranding(tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('logo_url, company_display_name, template_id')
    .eq('tenant_id', tenantId)
    .single()
  return data
}

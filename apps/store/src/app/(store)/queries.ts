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
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly,
        product_type:product_types ( slug, category )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('products.product_types.category', category)
    .order('created_at')
  return (data ?? []).filter((tp) => tp.products !== null)
}

export async function getSimulation(simulationId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      desired_amount,
      desired_term_months,
      status,
      products ( name )
    `)
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)
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

export async function getTenantBranding(tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('logo_url, company_display_name, template_id')
    .eq('tenant_id', tenantId)
    .single()
  return data
}

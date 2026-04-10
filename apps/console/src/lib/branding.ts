import { createServiceClient } from '@/lib/supabase/service'

export async function getTenantBranding(tenantId: string | null) {
  if (!tenantId) return null

  const supabase = createServiceClient()

  const { data } = await supabase
    .from('tenant_branding')
    .select('logo_url, favicon_url, auth_bg_image_url, company_display_name')
    .eq('tenant_id', tenantId)
    .single()

  return data
}

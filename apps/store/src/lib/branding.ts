import { cache } from 'react'

import { createServiceClient } from '@/lib/supabase/service'

export const getTenantBranding = cache(async (tenantId: string | null | undefined) => {
  if (!tenantId) return null

  const supabase = createServiceClient()

  const { data } = await supabase
    .from('tenant_branding')
    .select(
      'logo_url, favicon_url, auth_bg_image_url, company_display_name, theme_color, template_id, use_custom_theme, custom_css',
    )
    .eq('tenant_id', tenantId)
    .single()

  return data
})

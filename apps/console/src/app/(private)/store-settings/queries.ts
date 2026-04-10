import { createClient } from '@/lib/supabase/server'

// RLS em tenant_branding filtra automaticamente para o branding do tenant autenticado
export async function getTenantBrandingSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('tenant_id, logo_url, favicon_url, base_color, theme_color')
    .single()
  return data
}

export type BrandingSettings = Awaited<ReturnType<typeof getTenantBrandingSettings>>

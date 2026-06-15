import { env } from '@vello/env/console'
import { createServiceClient } from '@/lib/supabase/service'

export async function getPortalUrl(tenantId: string): Promise<string> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenants')
    .select('slug, custom_domain')
    .eq('id', tenantId)
    .single()
  if (!data) return ''

  const host = data.custom_domain && data.custom_domain.length > 0
    ? data.custom_domain
    : `${data.slug}.${env.STORE_BASE_DOMAIN}`

  return `https://${host}/meus-documentos`
}

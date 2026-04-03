// Edge Function: custom-access-token
// Hook do tipo "Custom Access Token" — executado antes de emitir cada JWT.
// Injeta `role` e `tenant_id` no token para uso nas RLS policies.
//
// Deploy: supabase functions deploy custom-access-token --no-verify-jwt
// Configurar no Dashboard: Authentication → Hooks → Custom Access Token

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WebhookPayload {
  user_id: string
  claims: Record<string, unknown>
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  const { user_id, claims } = payload

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Tenta como usuário do backoffice
  const { data: backofficeUser } = await supabase
    .from('backoffice_users')
    .select('role, is_active')
    .eq('id', user_id)
    .single()

  if (backofficeUser?.is_active) {
    return Response.json({
      ...claims,
      role: backofficeUser.role,
      tenant_id: null,
    })
  }

  // Tenta como usuário de tenant
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('role, tenant_id, is_active')
    .eq('id', user_id)
    .single()

  if (tenantUser?.is_active) {
    return Response.json({
      ...claims,
      role: tenantUser.role,
      tenant_id: tenantUser.tenant_id,
    })
  }

  // Sem perfil — retorna claims sem role (bloqueado pelo RLS)
  return Response.json(claims)
})

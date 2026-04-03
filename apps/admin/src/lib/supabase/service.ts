import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@vello/database'
import { env } from '@vello/env/admin'

// Client com permissão total — bypassa RLS completamente.
// Usar APENAS em Server Actions e Edge Functions que precisam de acesso irrestrito.
// Ex: provisionar tenant, criar usuário admin, operações sem tenant_id.
export function createServiceClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
  )
}

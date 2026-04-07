import { createClient } from '@supabase/supabase-js'
import type { Database } from '@vello/database'
import { env } from '@vello/env/console'

// Client com permissão total — bypassa RLS completamente.
// Usar APENAS em Server Actions e Route Handlers que precisam de acesso irrestrito.
// Ex: lookup de tenant-theme sem sessão autenticada.
export function createServiceClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
  )
}

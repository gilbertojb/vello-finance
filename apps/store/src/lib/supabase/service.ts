import { createClient } from '@supabase/supabase-js'
import type { Database } from '@vello/database'
import { env } from '@vello/env/store'

// Client com permissão total — bypassa RLS completamente.
// Usar APENAS em Server Actions e Route Handlers que precisam de acesso irrestrito.
export function createServiceClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
  )
}

// apps/store/src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@vello/database'
import { env } from '@vello/env/store'
import { getStorageKey } from './storage-key'

// Uso permitido APENAS em Client Components para:
// - auth.getUser()   → verificar sessão ativa
// - auth.signOut()   → logout
// NUNCA usar supabase.from() aqui — toda query de dados é feita no servidor.
export function createClient() {
  const tenantId = document.documentElement.dataset.tenantId ?? ''

  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { storageKey: getStorageKey(tenantId) } },
  )
}

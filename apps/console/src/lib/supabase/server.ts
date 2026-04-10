import { createServerClient } from '@supabase/ssr'
import type { Database } from '@vello/database'
import { env } from '@vello/env/console'
import { cookies } from 'next/headers'
import { headers } from 'next/headers'
import { getStorageKey } from './storage-key'

// Usar em: Server Components, Server Actions, Route Handlers.
// Este client respeita RLS — as queries são feitas sob a sessão do usuário autenticado.
// O storageKey é dinâmico por tenant — cada tenant tem seu próprio cookie.
export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { storageKey: getStorageKey(tenantId) },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component — cookies só podem ser escritos em Actions/Route Handlers
          }
        },
      },
    },
  )
}

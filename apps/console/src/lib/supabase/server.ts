import { createServerClient } from '@supabase/ssr'
import type { Database } from '@vello/database'
import { env } from '@vello/env/console'
import { cookies } from 'next/headers'

// Usar em: Server Components, Server Actions, Route Handlers.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
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

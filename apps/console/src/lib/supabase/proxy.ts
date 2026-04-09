// apps/console/src/lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { env } from '@vello/env/console'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; isAuthenticated: boolean; userId: string | null }> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { storageKey: 'vello-console-auth' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: não inserir código entre createServerClient e getUser()
  const { data } = await supabase.auth.getUser()

  return {
    response: supabaseResponse,
    isAuthenticated: !!data?.user,
    userId: data?.user?.id ?? null,
  }
}

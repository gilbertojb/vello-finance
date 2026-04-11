import { createServerClient } from '@supabase/ssr'
import { env } from '@vello/env/admin'
import { type NextRequest, NextResponse } from 'next/server'

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export async function updateSession(
  request: NextRequest,
) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })
          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value)
          })
        },
      },
    },
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getUser() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getUser()

  // getUser() valida o token com o servidor e retorna app_metadata do BANCO.
  // Para ler claims injetados pelo auth hook (user_role, tenant_id),
  // decodificamos o access_token do JWT diretamente.
  const { data: { session } } = await supabase.auth.getSession()
  const jwtClaims = session?.access_token
    ? decodeJwtPayload(session.access_token)
    : null

  return {
    response: supabaseResponse,
    isAuthenticated: !!data?.user,
    user: data?.user as Record<string, unknown> | null,
    jwtClaims,
  }
}

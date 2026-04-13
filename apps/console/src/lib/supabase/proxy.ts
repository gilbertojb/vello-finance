// apps/console/src/lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { env } from '@vello/env/console'
import { type NextRequest, NextResponse } from 'next/server'

import { getStorageKey } from './storage-key'

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
  tenant: { id: string; slug: string },
): Promise<{
  response: NextResponse
  isAuthenticated: boolean
  userId: string | null
  jwtClaims: Record<string, unknown> | null
}> {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-id', tenant.id)
  requestHeaders.set('x-tenant-slug', tenant.slug)

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { storageKey: getStorageKey(tenant.id) },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANTE: não inserir código entre createServerClient e getUser()
  const { data } = await supabase.auth.getUser()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const jwtClaims = session?.access_token
    ? decodeJwtPayload(session.access_token)
    : null

  return {
    response: supabaseResponse,
    isAuthenticated: !!data?.user,
    userId: data?.user?.id ?? null,
    jwtClaims,
  }
}

import { createServerClient } from '@supabase/ssr'
import { env } from '@vello/env/admin'
import { type NextRequest, NextResponse } from 'next/server'

/**
 * Rotas públicas e como se comportam quando o usuário já está autenticado:
 * - 'redirect' → redireciona para o dashboard (ex: /sign-in enquanto logado)
 * - 'next'     → permite acesso mesmo autenticado (ex: /reset-password)
 */
const publicRoutesPatterns = [
  { path: '/sign-in', whenAuthenticated: 'redirect' as const },
  { path: '/forgot-password', whenAuthenticated: 'redirect' as const },
  { path: '/reset-password', whenAuthenticated: 'next' as const },
]

function getIsPublicUrl(pathname: string) {
  for (const { path, whenAuthenticated } of publicRoutesPatterns) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return { isPublicUrl: true, whenAuthenticated }
    }
  }

  return { isPublicUrl: false, whenAuthenticated: null }
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        },
      },
    },
  )

  // CRÍTICO: não adicionar código entre createServerClient e getClaims().
  // Qualquer instrução aqui pode causar logout inesperado dos usuários.
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = !!data?.claims

  const { pathname } = request.nextUrl
  const { isPublicUrl, whenAuthenticated } = getIsPublicUrl(pathname)

  if (!isAuthenticated && !isPublicUrl) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  if (isAuthenticated && isPublicUrl && whenAuthenticated === 'redirect') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { hasBackofficeAccess, jwtClaimsSchema } from '@vello/auth'
import { type NextRequest, NextResponse } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'

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
  const { response, isAuthenticated, jwtClaims } = await updateSession(request)

  const { pathname } = request.nextUrl
  const { isPublicUrl, whenAuthenticated } = getIsPublicUrl(pathname)

  if (!isAuthenticated && !isPublicUrl) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  if (isAuthenticated) {
    // Claims vêm do JWT decodificado (getSession), onde o auth hook injeta user_role.
    // getUser() retorna app_metadata do banco (sem claims do hook) — por isso não serve aqui.
    const parsed = jwtClaims ? jwtClaimsSchema.safeParse(jwtClaims) : null
    const claims = parsed?.success ? parsed.data : null
    const isBackoffice = claims && hasBackofficeAccess(claims.user_role)

    if (!isPublicUrl && !isBackoffice) {
      const url = request.nextUrl.clone()
      url.pathname = '/sign-in'
      return NextResponse.redirect(url)
    }

    if (isPublicUrl && whenAuthenticated === 'redirect' && isBackoffice) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

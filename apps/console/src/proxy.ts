import { hasTenantAccess, jwtClaimsSchema } from '@vello/auth'
import { type NextRequest, NextResponse } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'
import { resolveTenant } from '@/lib/tenant/resolve-tenant'

// Rotas públicas e comportamento quando o usuário já está autenticado.
const publicRoutes = [
  { path: '/sign-in', whenAuthenticated: 'redirect' as const },
  { path: '/forgot-password', whenAuthenticated: 'redirect' as const },
  { path: '/reset-password', whenAuthenticated: 'next' as const },
]

function getRouteType(pathname: string) {
  for (const { path, whenAuthenticated } of publicRoutes) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return { isPublic: true, whenAuthenticated }
    }
  }
  return { isPublic: false, whenAuthenticated: null }
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  // Ignorar API routes e assets estáticos (coberto pelo matcher, mas por precaução)
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next({ request })
  }

  // 1. Resolver tenant a partir do host
  const tenant = await resolveTenant(host)

  if (!tenant) {
    const url = request.nextUrl.clone()
    url.pathname = '/not-found'
    return NextResponse.rewrite(url, { status: 404 })
  }

  if (tenant.status !== 'active') {
    const url = request.nextUrl.clone()
    url.pathname = '/unavailable'
    return NextResponse.rewrite(url, { status: 503 })
  }

  // 2. Renovar sessão Supabase e obter jwtClaims (storageKey dinâmico por tenant)
  let { response, isAuthenticated, jwtClaims } = await updateSession(
    request,
    tenant.id,
  )

  // Copiar headers da resposta do updateSession para nossa resposta base
  const newResponse = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  // Injetar headers internos (não expostos ao browser pelo Next.js)
  newResponse.headers.set('x-tenant-id', tenant.id)
  newResponse.headers.set('x-tenant-slug', tenant.slug)

  // Propagar cookies da sessão do updateSession
  response.cookies.getAll().forEach((cookie) => {
    newResponse.cookies.set(cookie)
  })

  const { isPublic, whenAuthenticated } = getRouteType(pathname)

  let isAuthorized = false
  let needsForceSignout = false

  // 3. Validar role e tenant do usuário autenticado via JWT Claims
  if (isAuthenticated) {
    const parsed = jwtClaims ? jwtClaimsSchema.safeParse(jwtClaims) : null
    const claims = parsed?.success ? parsed.data : null

    if (
      claims &&
      hasTenantAccess(claims.user_role) &&
      claims.tenant_id === tenant.id
    ) {
      isAuthorized = true
    } else {
      needsForceSignout = true
    }
  }

  // 4. Se a sessão é aparentemente válida mas não tem autorização correta, trata como não autenticado
  if (isAuthenticated && !isAuthorized) {
    isAuthenticated = false
  }

  // 5. Rota privada sem autenticação/autorização → redirect para sign-in
  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    const redirectResponse = NextResponse.redirect(url)
    if (needsForceSignout) {
      redirectResponse.headers.set('x-force-signout', '1')
    }
    return redirectResponse
  }

  // 6. Usuário autenticado e autorizado em rota pública (ex: /sign-in) → redirect para dashboard
  if (isAuthenticated && isPublic && whenAuthenticated === 'redirect') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 7. Repassa a intenção de force sign-out para a página carregada
  if (needsForceSignout) {
    newResponse.headers.set('x-force-signout', '1')
  }

  return newResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

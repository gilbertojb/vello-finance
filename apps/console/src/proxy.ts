import { getJwtClaims, hasTenantAccess } from '@vello/auth'
import { env } from '@vello/env/console'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

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

// Resolve o tenant a partir do host.
// Subdomínio → slug; custom_domain → busca no banco via fetch REST.
async function resolveTenant(
  rawHost: string,
): Promise<{ id: string; slug: string; status: string } | null> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SECRET_KEY
  const baseDomain = env.CONSOLE_BASE_DOMAIN

  if (!supabaseUrl || !serviceKey) return null

  // Remover porta do host (ex: "slug.vellofinance.com.br:3001" → "slug.vellofinance.com.br")
  const host = rawHost.split(':')[0]

  let filter: string

  if (host.endsWith(`.${baseDomain}`)) {
    // Subdomínio: slug.vellofinance.com.br → slug=slug
    const slug = host.slice(0, host.length - baseDomain.length - 1)
    if (!slug) return null
    filter = `slug=eq.${slug}`
  } else {
    // Domínio customizado → busca por custom_domain
    filter = `custom_domain=eq.${host}`
  }

  const url = `${supabaseUrl}/rest/v1/tenants?select=id,slug,status&${filter}&limit=1`

  const response = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) return null
  const data = (await response.json()) as Array<{
    id: string
    slug: string
    status: string
  }>
  return data[0] ?? null
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
    // Tenant não encontrado — retornar 404 simples
    return new NextResponse('Tenant não encontrado', { status: 404 })
  }

  if (tenant.status !== 'active') {
    // Tenant inativo/suspenso — retornar 503
    return new NextResponse('Este espaço está temporariamente indisponível', {
      status: 503,
    })
  }

  // 2. Renovar sessão Supabase e obter userId (storageKey dinâmico por tenant)
  const { response, isAuthenticated, userId } = await updateSession(
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

  // 3. Rota privada sem autenticação → redirect para sign-in
  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  // 4. Usuário autenticado em rota pública (ex: /sign-in) → redirect para dashboard
  if (isAuthenticated && isPublic && whenAuthenticated === 'redirect') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 5. Validar role do usuário autenticado via @vello/auth (sem hardcode de arrays)
  if (isAuthenticated && userId) {
    // Buscar app_metadata do usuário para extrair claims
    const userUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`
    const userResponse = await fetch(userUrl, {
      headers: {
        apikey: env.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
      },
      cache: 'no-store',
    })

    if (userResponse.ok) {
      const userData = (await userResponse.json()) as {
        app_metadata?: Record<string, unknown>
      }
      const claims = getJwtClaims(userData)

      // Role não é de tenant → expulsar (pode ser usuário do backoffice tentando acessar console)
      if (!claims || !hasTenantAccess(claims.user_role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        // Sinaliza que a sessão deve ser invalidada na próxima renderização
        const redirectResponse = NextResponse.redirect(url)
        redirectResponse.headers.set('x-force-signout', '1')
        return redirectResponse
      }

      // tenant_id no JWT deve bater com o tenant resolvido pelo host
      if (claims.tenant_id !== tenant.id) {
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        const redirectResponse = NextResponse.redirect(url)
        redirectResponse.headers.set('x-force-signout', '1')
        return redirectResponse
      }
    }
  }

  return newResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

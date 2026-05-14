import { type NextRequest, NextResponse } from 'next/server'

import { updateSession } from '@/lib/supabase/proxy'
import { resolveTenant } from '@/lib/tenant/resolve-tenant'

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  // Ignorar assets estáticos e requests internos do Next.js
  if (pathname.startsWith('/_next/')) {
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

  // 2. Renovar sessão Supabase e injetar x-tenant-id / x-tenant-slug nos headers
  //    A store é pública — não há redirecionamento para sign-in.
  //    O updateSession garante que tokens sejam renovados para uso futuro (ex: OTP de proposta).
  const { response } = await updateSession(request, tenant)

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

import { type NextRequest, NextResponse } from 'next/server'

import { createServiceClient } from '@/lib/supabase/service'

const FORBIDDEN_CSS_PATTERNS = [
  /url\s*\(/i,
  /@import/i,
  /expression\s*\(/i,
  /javascript\s*:/i,
  /-moz-binding/i,
  /behavior\s*:/i,
]

function isSafeCss(css: string): boolean {
  return !FORBIDDEN_CSS_PATTERNS.some((p) => p.test(css))
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Buscar tenant pelo slug (service role — bypass RLS)
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', slug)
    .single()

  const emptyResponse = NextResponse.json(
    { css: null, baseColor: null, themeColor: null },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  )

  if (tenantError || !tenant) {
    return emptyResponse
  }

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('use_custom_theme, base_color, theme_color, custom_css')
    .eq('tenant_id', tenant.id)
    .single()

  if (!branding?.use_custom_theme || !branding.custom_css || !isSafeCss(branding.custom_css)) {
    return NextResponse.json(
      {
        css: null,
        baseColor: branding?.base_color ?? null,
        themeColor: branding?.theme_color ?? null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    )
  }

  return NextResponse.json(
    { css: branding.custom_css },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  )
}

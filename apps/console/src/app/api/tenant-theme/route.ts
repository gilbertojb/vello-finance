import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

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

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('use_custom_theme, base_color, theme_color, custom_css')
    .eq('tenant_id', tenant.id)
    .single()

  // Se o tenant não usa tema customizado, retornar payload vazio
  if (!branding?.use_custom_theme) {
    return NextResponse.json(
      {
        selector: null,
        baseColor: branding?.base_color ?? null,
        themeColor: branding?.theme_color ?? null,
        variables: {},
        customCss: null,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        },
      },
    )
  }

  const selector = `[data-tenant-theme="${tenant.slug}"]`

  // custom_css é JSONB: { token-name: "valor CSS", ..., rawCss: "..." }
  // Todas as chaves exceto "rawCss" são CSS variables injetadas no seletor do tenant.
  const themeConfig = (branding.custom_css ?? {}) as Record<string, string>
  const { rawCss, ...tokenEntries } = themeConfig

  const variables: Record<string, string> = {}
  for (const [key, value] of Object.entries(tokenEntries)) {
    if (value) variables[key] = value
  }

  return NextResponse.json(
    {
      selector,
      baseColor: branding.base_color ?? null,
      themeColor: branding.theme_color ?? null,
      variables,
      customCss: rawCss ?? null,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    },
  )
}

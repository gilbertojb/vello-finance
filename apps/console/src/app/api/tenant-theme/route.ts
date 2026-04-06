import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Buscar tenant pelo slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', slug)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  // Buscar branding e tokens em paralelo
  const [brandingResult, tokensResult] = await Promise.all([
    supabase
      .from('tenant_branding')
      .select('use_custom_theme, base_color, theme_color, custom_css')
      .eq('tenant_id', tenant.id)
      .single(),
    supabase
      .from('tenant_theme_tokens')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single(),
  ])

  const branding = brandingResult.data
  const tokens = tokensResult.data

  // Se o tenant não usa tema customizado, retornar payload vazio
  if (!branding?.use_custom_theme) {
    return NextResponse.json({
      selector: null,
      baseColor: branding?.base_color ?? null,
      themeColor: branding?.theme_color ?? null,
      variables: {},
      customCss: null,
    })
  }

  const selector = `[data-tenant-theme="${slug}"]`

  // Mapear colunas do banco para nomes de CSS variables
  const variables: Record<string, string> = {}

  const tokenMap: Record<string, string | null | undefined> = {
    background:               tokens?.background,
    foreground:               tokens?.foreground,
    card:                     tokens?.card,
    'card-foreground':        tokens?.card_foreground,
    popover:                  tokens?.popover,
    'popover-foreground':     tokens?.popover_foreground,
    primary:                  tokens?.primary_token,
    'primary-foreground':     tokens?.primary_foreground,
    secondary:                tokens?.secondary_token,
    'secondary-foreground':   tokens?.secondary_foreground,
    muted:                    tokens?.muted,
    'muted-foreground':       tokens?.muted_foreground,
    accent:                   tokens?.accent,
    'accent-foreground':      tokens?.accent_foreground,
    destructive:              tokens?.destructive,
    'destructive-foreground': tokens?.destructive_foreground,
    border:                   tokens?.border_token,
    input:                    tokens?.input_token,
    ring:                     tokens?.ring_token,
    radius:                   tokens?.radius_token,
    'chart-1':                tokens?.chart_1,
    'chart-2':                tokens?.chart_2,
    'chart-3':                tokens?.chart_3,
    'chart-4':                tokens?.chart_4,
    'chart-5':                tokens?.chart_5,
    sidebar:                  tokens?.sidebar_background,
    'sidebar-foreground':     tokens?.sidebar_foreground,
    'sidebar-primary':        tokens?.sidebar_primary,
    'sidebar-primary-foreground': tokens?.sidebar_primary_foreground,
    'sidebar-accent':         tokens?.sidebar_accent,
    'sidebar-accent-foreground':  tokens?.sidebar_accent_foreground,
    'sidebar-border':         tokens?.sidebar_border,
    'sidebar-ring':           tokens?.sidebar_ring,
  }

  for (const [cssVar, value] of Object.entries(tokenMap)) {
    if (value) variables[cssVar] = value
  }

  return NextResponse.json({
    selector,
    baseColor: branding.base_color ?? null,
    themeColor: branding.theme_color ?? null,
    variables,
    customCss: branding.custom_css ?? null,
  })
}

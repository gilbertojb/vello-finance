import { env } from '@vello/env/console'

export async function resolveTenant(
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
    // Domínio customizado do console → busca por console_custom_domain
    filter = `console_custom_domain=eq.${host}`
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

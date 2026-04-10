interface TenantThemePayload {
  css: string | null
  baseColor?: string | null
  themeColor?: string | null
}

const STYLE_ID = 'tenant-theme'

export async function loadTenantTheme(tenantSlug: string): Promise<void> {
  const response = await fetch(`/api/tenant-theme?slug=${encodeURIComponent(tenantSlug)}`)

  if (!response.ok) return

  const payload: TenantThemePayload = await response.json()

  if (payload.css) {
    injectStyle(STYLE_ID, payload.css)
  }
}

function injectStyle(id: string, css: string): void {
  let el = document.getElementById(id) as HTMLStyleElement | null

  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }

  el.textContent = css
}

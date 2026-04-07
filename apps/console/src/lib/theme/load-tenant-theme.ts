interface TenantThemePayload {
  selector: string | null
  baseColor: string | null
  themeColor: string | null
  variables: Record<string, string>
  customCss: string | null
}

const STYLE_ID_TOKENS = 'tenant-theme-tokens'
const STYLE_ID_CUSTOM = 'tenant-theme-custom'

export async function loadTenantTheme(tenantSlug: string): Promise<void> {
  const response = await fetch(`/api/tenant-theme?slug=${tenantSlug}`)

  if (!response.ok) return

  const payload: TenantThemePayload = await response.json()

  applyTenantTheme(payload)
}

export function applyTenantTheme(payload: TenantThemePayload): void {
  // 1. Aplicar CSS variables como bloco <style>
  if (payload.selector && Object.keys(payload.variables).length > 0) {
    const declarations = Object.entries(payload.variables)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join('\n')

    const css = `${payload.selector} {\n${declarations}\n}`

    injectStyle(STYLE_ID_TOKENS, css)
  }

  // 2. Injetar custom_css por último (maior precedência)
  if (payload.customCss) {
    injectStyle(STYLE_ID_CUSTOM, payload.customCss)
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

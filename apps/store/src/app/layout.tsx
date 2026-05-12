import './globals.css'
import { Poppins, Playfair_Display } from 'next/font/google'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { getTenantBranding } from '@/lib/branding'
import { getTemplate } from '@/templates'
import { generateThemeCss } from '@/lib/template/generate-theme'
import { cn } from '@/lib/utils'
import { Providers } from './providers'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  weight: ['400', '700'],
  variable: '--font-serif',
  display: 'swap',
})

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

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  const branding = await getTenantBranding(tenantId)
  return {
    title: branding?.company_display_name
      ? { template: `%s | ${branding.company_display_name}`, default: branding.company_display_name }
      : { template: '%s | Vello Store', default: 'Vello Store' },
    icons: branding?.favicon_url ? { icon: branding.favicon_url } : undefined,
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const tenantSlug = headerStore.get('x-tenant-slug') ?? 'default'
  const tenantId   = headerStore.get('x-tenant-id') ?? ''

  const branding  = await getTenantBranding(tenantId)
  const template  = getTemplate(branding?.template_id)
  const themeCss  = generateThemeCss(template.colors)
  const customCss = branding?.use_custom_theme && branding?.custom_css
    ? String(branding.custom_css)
    : null

  return (
    <html
      lang="pt-BR"
      className={cn(poppins.variable, playfair.variable)}
      data-tenant-theme={tenantSlug}
      data-tenant-id={tenantId}
      suppressHydrationWarning
    >
      <head>
        {/* Tema do template — sobrescreve globals.css para cada tenant */}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        {/* CSS customizado adicional do tenant (apenas white-labels com use_custom_theme=true) */}
        {customCss && isSafeCss(customCss) && (
          <style dangerouslySetInnerHTML={{ __html: customCss }} />
        )}
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}

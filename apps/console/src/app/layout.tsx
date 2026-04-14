// apps/console/src/app/layout.tsx
import './globals.css'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'

import { getTenantBranding } from '@/lib/branding'
import { createServiceClient } from '@/lib/supabase/service'

import { cn } from '@/lib/utils'
import { Providers } from './providers'

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
      ? {
          template: `%s | ${branding.company_display_name}`,
          default: branding.company_display_name,
        }
      : { template: '%s | Vello Console', default: 'Vello Console' },
    icons: branding?.favicon_url ? { icon: branding.favicon_url } : undefined,
  }
}

async function getTenantCustomCss(tenantId: string): Promise<string | null> {
  if (!tenantId) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('use_custom_theme, custom_css')
    .eq('tenant_id', tenantId)
    .single()
  if (!data?.use_custom_theme) return null
  return data.custom_css
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  const headerStore = await headers()
  const tenantSlug = headerStore.get('x-tenant-slug') ?? 'default'
  const tenantId = headerStore.get('x-tenant-id') ?? ''
  const customCss = await getTenantCustomCss(tenantId)

  return (
    <html
      lang="pt-BR"
      className={cn(GeistSans.variable, GeistMono.variable, 'font-sans')}
      data-tenant-theme={tenantSlug}
      data-tenant-id={tenantId}
      suppressHydrationWarning
    >
      <head>
        {customCss && isSafeCss(customCss) && (
          <style dangerouslySetInnerHTML={{ __html: customCss }} />
        )}
      </head>
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}

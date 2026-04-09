import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Image from 'next/image'
import type { ReactNode } from 'react'

import logo from '@/assets/logo.svg'
import { createServiceClient } from '@/lib/supabase/service'

async function getTenantBranding(tenantId: string | null) {
  if (!tenantId) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('logo_url, favicon_url, auth_bg_image_url, company_display_name, custom_css')
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  const branding = await getTenantBranding(tenantId)

  return {
    title: branding?.company_display_name
      ? { template: `%s | ${branding.company_display_name}`, default: branding.company_display_name }
      : { template: '%s | Vello Console', default: 'Vello Console' },
    icons: branding?.favicon_url ? { icon: branding.favicon_url } : undefined,
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  const branding = await getTenantBranding(tenantId)

  // Extrair primary/secondary do custom_css JSONB para o gradiente fallback
  const cssTokens = ((branding?.custom_css ?? {}) as Record<string, string>)
  const primary = cssTokens['primary'] ?? 'oklch(0.478 0.152 260.5)'
  const secondary = cssTokens['secondary'] ?? 'oklch(0.305 0.093 255.5)'

  return (
    <div className="grid min-h-svh lg:grid-cols-[40%_60%]">
      {/* Painel esquerdo — formulário */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-zinc-900">
        <div>
          {branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo_url}
              alt="Logo"
              className="h-8 w-auto"
            />
          ) : (
            <Image src={logo} alt="Vello" height={32} loading="eager" />
          )}
        </div>
        <div className="flex flex-1 items-center justify-center">
          {children}
        </div>
      </div>

      {/* Painel direito — imagem ou gradiente */}
      <div className="relative hidden lg:block">
        {branding?.auth_bg_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.auth_bg_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
          />
        )}
      </div>
    </div>
  )
}

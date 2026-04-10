import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Image from 'next/image'
import type { ReactNode } from 'react'

import logo from '@/assets/logo.svg'
import { getTenantBranding } from '@/lib/branding'

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

export default async function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  const branding = await getTenantBranding(tenantId)

  return (
    <div className="grid min-h-svh lg:grid-cols-[30%_70%]">
      {/* Painel esquerdo — formulário */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-background">
        <div>
          {branding?.logo_url ? (
            <Image
              src={branding.logo_url}
              alt={branding.company_display_name ?? ''}
              className="h-8 w-auto"
              loading="eager"
              width={100}
              height={100}
              unoptimized
            />
          ) : (
            <Image src={logo} alt="Vello" height={32} loading="eager" />
          )}
        </div>
        <div className="flex flex-1 items-center justify-center">
          {children}
        </div>
      </div>

      {/* Painel direito — imagem ou gradiente com CSS vars do tenant */}
      <div className="relative hidden lg:block">
        {branding?.auth_bg_image_url ? (
          <Image
            src={branding.auth_bg_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fill
          />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-primary" />
        )}
      </div>
    </div>
  )
}

import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { getTenantBranding } from '@/lib/branding'

import { StoreFooter } from './_components/store-footer'
import { StoreHeader } from './_components/store-header'

export default async function StoreLayout({
  children,
}: {
  children: ReactNode
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''
  const branding = await getTenantBranding(tenantId)

  return (
    <div className="flex min-h-svh flex-col">
      <StoreHeader
        logoUrl={branding?.logo_url ?? null}
        displayName={branding?.company_display_name ?? null}
      />
      <main className="flex-1">{children}</main>
      <StoreFooter
        displayName={branding?.company_display_name ?? null}
        logoUrl={branding?.logo_url ?? null}
      />
    </div>
  )
}

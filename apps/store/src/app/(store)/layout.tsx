import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { getTenantBranding } from '@/lib/branding'
import { StoreHeader } from './_components/store-header'
import { StoreFooter } from './_components/store-footer'

export default async function StoreLayout({ children }: { children: ReactNode }) {
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
      <StoreFooter displayName={branding?.company_display_name ?? null} />
    </div>
  )
}

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { TenantThemeLoader } from '@/components/tenant-theme-loader'
import './globals.css'

export const metadata: Metadata = {
  title: 'Console',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // O middleware injeta o slug do tenant no header x-tenant-slug.
  // Fallback: 'default' para tenants sem white-label.
  const headerStore = await headers()
  const tenantSlug = headerStore.get('x-tenant-slug') ?? 'default'

  return (
    <html lang="pt-BR" data-tenant-theme={tenantSlug}>
      <body>
        <TenantThemeLoader tenantSlug={tenantSlug} />
        {children}
      </body>
    </html>
  )
}

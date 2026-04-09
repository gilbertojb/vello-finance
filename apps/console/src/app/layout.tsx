// apps/console/src/app/layout.tsx
import './globals.css'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

// TODO: import { Toaster } from '@/components/ui/sonner' — will be added in Task 6
// TODO: import { TenantThemeLoader } from '@/components/tenant-theme-loader' — will be added with white-label theme feature

import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    template: '%s | Vello Console',
    default: 'Vello Console',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const tenantSlug = headerStore.get('x-tenant-slug') ?? 'default'

  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-tenant-theme={tenantSlug}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

'use client'

import { useEffect } from 'react'
import { loadTenantTheme } from '@/lib/theme/load-tenant-theme'

interface TenantThemeLoaderProps {
  tenantSlug: string
}

export function TenantThemeLoader({ tenantSlug }: TenantThemeLoaderProps) {
  useEffect(() => {
    if (!tenantSlug || tenantSlug === 'default') return
    loadTenantTheme(tenantSlug).catch((err: unknown) => {
      console.error('[TenantThemeLoader] Failed to load theme for', tenantSlug, err)
    })
  }, [tenantSlug])

  return null
}

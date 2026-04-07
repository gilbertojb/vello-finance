'use client'

import { useEffect } from 'react'
import { loadTenantTheme } from '@/lib/theme/load-tenant-theme'

interface TenantThemeLoaderProps {
  tenantSlug: string
}

export function TenantThemeLoader({ tenantSlug }: TenantThemeLoaderProps) {
  useEffect(() => {
    if (!tenantSlug || tenantSlug === 'default') return
    loadTenantTheme(tenantSlug)
  }, [tenantSlug])

  return null
}

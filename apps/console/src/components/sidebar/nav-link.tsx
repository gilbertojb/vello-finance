'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import type { ComponentProps } from 'react'

import { SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface NavLinkProps extends ComponentProps<typeof Link> {
  icon: React.ReactNode
  label: string
  tooltip?: string
}

export function NavLink({ icon, label, tooltip, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = props.href.toString() === pathname

  return (
    <SidebarMenuButton tooltip={tooltip || label} isActive={isActive} asChild>
      <Link
        data-current={isActive}
        {...props}
        className={cn(
          'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-foreground/70 hover:bg-secondary hover:text-foreground',
        )}
      >
        {icon}
        <span>{label}</span>
      </Link>
    </SidebarMenuButton>
  )
}

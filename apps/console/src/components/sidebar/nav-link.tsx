'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps } from 'react'

import { SidebarMenuButton } from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface NavLinkProps extends Omit<ComponentProps<typeof Link>, 'href'> {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
  disabled?: boolean
}

export function NavLink({ icon, label, badge, disabled, href, ...props }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = href !== '#' && (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <SidebarMenuButton tooltip={label} isActive={isActive} asChild>
      <Link
        href={href}
        {...props}
        onClick={disabled ? (e) => e.preventDefault() : undefined}
        className={cn(
          'group flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors w-full',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : disabled
              ? 'text-muted-foreground/40 cursor-not-allowed'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground',
        )}
      >
        <span className={cn('shrink-0', isActive ? 'text-sidebar-primary' : '')}>
          {icon}
        </span>
        <span className="flex-1 truncate">{label}</span>
        {badge !== undefined && badge > 0 && (
          <span className={cn(
            'ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums',
            isActive
              ? 'bg-black/20 text-white'
              : 'bg-muted text-muted-foreground',
          )}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Link>
    </SidebarMenuButton>
  )
}

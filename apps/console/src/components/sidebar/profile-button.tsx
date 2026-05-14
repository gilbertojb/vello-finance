'use client'

import { EllipsisVertical, LogOut } from 'lucide-react'
import { useTransition } from 'react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { signOut } from '@/http/sign-out'

interface ProfileButtonProps {
  user: { name: string; email: string }
  initials?: string
}

export function ProfileButton({ user, initials: initialsOverride }: ProfileButtonProps) {
  function computeInitials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part: string) => part[0]?.toUpperCase() ?? '')
      .join('')
  }
  const avatarInitials = initialsOverride ?? computeInitials(user.name)
  const { isMobile } = useSidebar()
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(() => signOut())
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[oklch(0.75_0.15_70)] text-[oklch(0.10_0_0)] text-xs font-bold">
            {avatarInitials}
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
          <EllipsisVertical className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[oklch(0.75_0.15_70)] text-[oklch(0.10_0_0)] text-xs font-bold">
              {avatarInitials}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isPending}
            variant="destructive"
          >
            <LogOut className="size-4" />
            {isPending ? 'Saindo...' : 'Sair'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

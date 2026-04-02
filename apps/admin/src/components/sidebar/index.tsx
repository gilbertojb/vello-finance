import Image from 'next/image'

import logo from '@/assets/logo.svg'

import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
} from '@/components/ui/sidebar'

import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

interface SidebarProps extends React.ComponentProps<typeof SidebarPrimitive> {}

export function Sidebar({ ...props }: SidebarProps) {
  return (
    <SidebarPrimitive collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-between gap-2">
            <Image src={logo} alt="Vello" height={24} loading="eager" />
            <div className="bg-primary/10 rounded-full px-4 py-0.5 text-primary uppercase text-xs font-medium">
              Admin
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-6">
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </SidebarPrimitive>
  )
}

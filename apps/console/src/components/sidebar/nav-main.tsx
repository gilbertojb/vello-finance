import { LayoutDashboard, Package, Settings, ClipboardList } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { NavLink } from './nav-link'

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink
              href="/"
              icon={<LayoutDashboard className="size-4" />}
              label="Dashboard"
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <NavLink
              href="/products"
              icon={<Package className="size-4" />}
              label="Produtos"
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <NavLink
              href="/simulations"
              icon={<ClipboardList className="size-4" />}
              label="Simulações"
            />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <NavLink
              href="/store-settings"
              icon={<Settings className="size-4" />}
              label="Configuração da Loja"
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

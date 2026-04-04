import {
  Banknote,
  BarChart2,
  Briefcase,
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  Receipt,
} from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { NavLink } from './nav-link'

export async function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem key="dashboard">
            <NavLink href="/" icon={<LayoutDashboard />} label="Dashboard" />
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarGroup>
          <SidebarGroupLabel>Cadastros</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem key="tenants">
              <NavLink href="/tenants" icon={<Building2 />} label="Tenants" />
            </SidebarMenuItem>

            <SidebarMenuItem key="plans">
              <NavLink href="/plans" icon={<Briefcase />} label="Planos" />
            </SidebarMenuItem>

            <SidebarMenuItem key="products">
              <NavLink href="/products" icon={<Receipt />} label="Produtos" />
            </SidebarMenuItem>

            <SidebarMenuItem key="financial-partners">
              <NavLink
                href="/financial-partners"
                icon={<Landmark />}
                label="Instituições Financeiras"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Operação</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem key="proposals">
              <NavLink
                href="/proposals"
                icon={<FileText />}
                label="Propostas"
              />
            </SidebarMenuItem>

            <SidebarMenuItem key="financial">
              <NavLink
                href="/financial"
                icon={<Banknote />}
                label="Financeiro"
              />
            </SidebarMenuItem>

            <SidebarMenuItem key="reports">
              <NavLink
                href="/reports"
                icon={<BarChart2 />}
                label="Relatórios"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

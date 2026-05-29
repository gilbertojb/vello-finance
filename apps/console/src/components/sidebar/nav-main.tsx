import {
  BarChart2,
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  UserCog,
  Package,
  Megaphone,
  Settings,
  CircleDollarSign,
  TrendingUp,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { COMPLETED_STATUSES } from '@/app/(private)/proposals/status-config'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { NavLink } from './nav-link'

type NavItem = {
  href: string
  icon: React.ReactNode
  label: string
  badge?: number
  disabled?: boolean
}

export async function NavMain() {
  const supabase = await createClient()
  const [{ count: simCount }, { count: propCount }] = await Promise.all([
    supabase.from('simulations').select('*', { count: 'exact', head: true }),
    supabase.from('proposals').select('*', { count: 'exact', head: true }).in('status', COMPLETED_STATUSES as unknown as string[]),
  ])

  const sections: Array<{ label: string; items: NavItem[] }> = [
    {
      label: 'Visão Geral',
      items: [
        { href: '/', icon: <LayoutDashboard className="size-4" />, label: 'Dashboard' },
        { href: '/analytics', icon: <BarChart2 className="size-4" />, label: 'Analytics', disabled: true },
      ],
    },
    {
      label: 'Originação',
      items: [
        { href: '/simulations', icon: <ClipboardList className="size-4" />, label: 'Simulações', badge: simCount ?? 0 },
        { href: '/proposals', icon: <FileText className="size-4" />, label: 'Propostas', badge: propCount ?? 0 },
        { href: '/clients', icon: <Users className="size-4" />, label: 'Clientes' },
      ],
    },
    {
      label: 'Financeiro',
      items: [
        { href: '/financeiro', icon: <CircleDollarSign className="size-4" />, label: 'Financeiro' },
      ],
    },
    {
      label: 'Catálogo',
      items: [
        { href: '/products', icon: <Package className="size-4" />, label: 'Produtos' },
        { href: '/campaigns', icon: <Megaphone className="size-4" />, label: 'Campanhas', disabled: true },
      ],
    },
    {
      label: 'Relatórios',
      items: [
        { href: '/relatorios/origem-leads', icon: <TrendingUp className="size-4" />, label: 'Origem de Leads' },
        { href: '/relatorios/origem-vendas', icon: <TrendingUp className="size-4" />, label: 'Origem de Vendas' },
      ],
    },
    {
      label: 'Sistema',
      items: [
        { href: '/usuarios', icon: <UserCog className="size-4" />, label: 'Usuários' },
        { href: '/store-settings', icon: <Settings className="size-4" />, label: 'Configurações' },
      ],
    },
  ]

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.label} className="py-0">
          <SidebarGroupLabel className="text-[9px] font-semibold tracking-[0.12em] uppercase text-muted-foreground px-2 py-2">
            {section.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <NavLink
                    href={item.disabled ? '#' : item.href}
                    icon={item.icon}
                    label={item.label}
                    badge={'badge' in item ? (item.badge as number) : undefined}
                    disabled={item.disabled}
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}

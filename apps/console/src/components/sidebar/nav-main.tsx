import {
  BarChart2,
  Bell,
  LayoutDashboard,
  ClipboardList,
  FileText,
  Users,
  Package,
  Megaphone,
  Settings,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { NavLink } from './nav-link'

export async function NavMain() {
  const supabase = await createClient()
  const [{ count: simCount }, { count: propCount }] = await Promise.all([
    supabase.from('simulations').select('*', { count: 'exact', head: true }),
    supabase.from('proposals').select('*', { count: 'exact', head: true }),
  ])

  const sections = [
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
        { href: '/clients', icon: <Users className="size-4" />, label: 'Clientes', disabled: true },
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
      label: 'Sistema',
      items: [
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

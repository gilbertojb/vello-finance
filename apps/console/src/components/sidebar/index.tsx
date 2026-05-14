import { createClient } from '@/lib/supabase/server'

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

export async function Sidebar({ ...props }: SidebarProps) {
  // RLS filtra automaticamente para o branding do tenant autenticado
  const supabase = await createClient()
  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('logo_url')
    .single()

  return (
    <SidebarPrimitive collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border pb-3 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2">
              {branding?.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={branding.logo_url} alt="Logo" className="h-7 w-auto" />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[oklch(0.75_0.15_70)] text-[oklch(0.10_0_0)] text-xs font-bold shrink-0">
                  VP
                </div>
              )}
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-sm text-sidebar-foreground truncate">
                  Vello Pay
                </span>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[oklch(0.75_0.15_70)] text-[oklch(0.10_0_0)] shrink-0">
                  admin
                </span>
              </div>
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

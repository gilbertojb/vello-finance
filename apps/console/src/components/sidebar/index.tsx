import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  Sidebar as SidebarPrimitive,
} from '@/components/ui/sidebar'

import { createClient } from '@/lib/supabase/server'

import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

interface SidebarProps extends React.ComponentProps<typeof SidebarPrimitive> {}

export async function Sidebar({ ...props }: SidebarProps) {
  // RLS filtra automaticamente para o branding do tenant autenticado
  const supabase = await createClient()

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('logo_url, company_display_name')
    .single()

  return (
    <SidebarPrimitive collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border pb-3 pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2.5 px-2">
              {branding?.logo_url ? (
                // biome-ignore lint/performance/noImgElement: allowed for tenant branding
                <img
                  src={branding.logo_url}
                  alt="Logo"
                  className="h-7 w-auto"
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold shrink-0">
                  VP
                </div>
              )}
              <div className="flex flex-col min-w-0">
                <span className="font-semibold text-sm text-sidebar-foreground truncate">
                  {branding?.company_display_name || 'Vello Pay'}
                </span>
                <span className="text-xs italic text-sidebar-foreground/60">
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

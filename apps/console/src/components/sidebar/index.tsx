import Image from 'next/image'

import logo from '@/assets/logo.svg'
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {branding?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo_url} alt="Logo" className="h-6 w-auto" />
            ) : (
              <Image src={logo} alt="Vello" height={24} loading="eager" />
            )}
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

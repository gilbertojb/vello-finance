import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'

import { ProfileButton } from './profile-button'

export async function NavUser() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProfileButton />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

import { createClient } from '@/lib/supabase/server'
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { ProfileButton } from './profile-button'

export async function NavUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('backoffice_users')
    .select('full_name, role')
    .eq('id', user!.id)
    .single()

  const name = profile?.full_name ?? user?.email ?? 'Usuário'
  const email = user?.email ?? ''
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProfileButton
          name={name}
          email={email}
          initials={initials}
          role={profile?.role ?? 'support'}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

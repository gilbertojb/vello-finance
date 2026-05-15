import { createClient } from '@/lib/supabase/server'
import { ProfileButton } from './profile-button'

export async function NavUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let name = 'Usuário'
  let email = ''

  if (user) {
    const { data: profile } = await supabase
      .from('tenant_users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    name = profile?.full_name ?? 'Usuário'
    email = user.email ?? ''
  }

  return (
    <div className="border-t border-sidebar-border pt-3">
      <ProfileButton user={{ name, email }} />
    </div>
  )
}

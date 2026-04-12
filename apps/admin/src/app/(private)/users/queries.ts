import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function listUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('backoffice_users')
    .select('id, role, full_name, is_active, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error

  // Buscar emails do auth.users via service client
  const serviceClient = createServiceClient()

  const usersWithEmail = await Promise.all(
    data.map(async (user) => {
      const { data: authData } = await serviceClient.auth.admin.getUserById(user.id)
      return { ...user, email: authData?.user?.email ?? '' }
    }),
  )

  return usersWithEmail
}

export async function getUser(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('backoffice_users')
    .select('id, role, full_name, is_active, created_at')
    .eq('id', id)
    .single()
  if (error) throw error

  const serviceClient = createServiceClient()
  const { data: authData } = await serviceClient.auth.admin.getUserById(id)

  return { ...data, email: authData?.user?.email ?? '' }
}

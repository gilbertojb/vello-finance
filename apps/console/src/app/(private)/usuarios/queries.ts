import { createClient } from '@/lib/supabase/server'

export type TenantUserRow = {
  id: string
  tenant_id: string
  role: 'tenant_admin' | 'tenant_operator'
  full_name: string | null
  email: string | null
  is_active: boolean
  created_at: string
}

export async function listTenantUsers(): Promise<TenantUserRow[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenant_users')
    .select('id, tenant_id, role, full_name, email, is_active, created_at')
    .order('created_at')
  if (error) throw error
  return (data ?? []) as TenantUserRow[]
}

import { createClient } from '@/lib/supabase/server'

export async function listTenants() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select('id, name, slug, status, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getTenant(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tenants')
    .select(`
      *,
      tenant_branding(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

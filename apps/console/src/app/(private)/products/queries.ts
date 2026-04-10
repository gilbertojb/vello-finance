import { createClient } from '@/lib/supabase/server'

export async function listTenantProducts() {
  const supabase = await createClient()

  // RLS filtra automaticamente para os produtos do tenant autenticado
  const { data, error } = await supabase
    .from('tenant_products')
    .select(`
      id,
      is_active,
      tenant_commission_pct,
      products (
        id,
        name,
        type,
        description,
        is_active
      )
    `)
    .order('created_at')

  if (error) throw error
  return data ?? []
}

export type TenantProductRow = Awaited<ReturnType<typeof listTenantProducts>>[number]

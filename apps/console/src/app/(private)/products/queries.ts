import { createClient } from '@/lib/supabase/server'

export async function listTenantProducts() {
  const supabase = await createClient()

  // RLS filtra automaticamente para os produtos do tenant autenticado
  const { data, error } = await supabase
    .from('tenant_products')
    .select(`
      id,
      is_active,
      cover_url,
      tenant_commission_pct,
      products (
        id,
        name,
        description,
        is_active
      )
    `)
    .order('created_at')

  if (error) throw error

  return data ?? []
}

export type TenantProductRow = Awaited<
  ReturnType<typeof listTenantProducts>
>[number]

export async function listActiveProducts() {
  const supabase = await createClient()

  // RLS (tenant_read_active) filtra automaticamente para is_active = true
  const { data, error } = await supabase
    .from('products')
    .select('id, name, description, is_active')
    .eq('is_active', true)
    .order('name')

  if (error) throw error

  return data ?? []
}

export type ProductRow = Awaited<ReturnType<typeof listActiveProducts>>[number]

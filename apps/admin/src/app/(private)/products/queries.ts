import { createClient } from '@/lib/supabase/server'

export type ProductFilters = {
  category?: string
  status?: string
  q?: string
}

export async function listProducts(filters: ProductFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      category,
      is_active,
      product_type:product_types(id, name, slug),
      product_financial_partners(
        id,
        if_commission_pct,
        vello_commission_pct,
        is_active,
        financial_partner:financial_partners(id, name)
      )
    `)
    .order('name')

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filters.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  if (filters.q) {
    query = query.ilike('name', `%${filters.q}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_type:product_types(id, name, slug),
      product_financial_partners(
        id,
        financial_partner_id,
        if_commission_pct,
        vello_commission_pct,
        is_active,
        financial_partner:financial_partners(id, name)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function listFinancialPartners(onlyActive = true) {
  const supabase = await createClient()
  let query = supabase
    .from('financial_partners')
    .select('id, name')
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listPipelines(onlyActive = true) {
  const supabase = await createClient()
  let query = supabase
    .from('product_types')
    .select('id, name, slug, proposal_stages(id, name, order_num)')
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error

  // Ordenar etapas por order_num (Supabase não suporta order em nested select)
  return (data ?? []).map((p) => ({
    ...p,
    proposal_stages: [...(p.proposal_stages ?? [])].sort(
      (a, b) => a.order_num - b.order_num,
    ),
  }))
}

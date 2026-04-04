import { createClient } from '@/lib/supabase/server'

export async function listProducts(onlyActive = false) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      type,
      is_active,
      product_financial_partners(
        id,
        if_commission_pct,
        vello_commission_pct,
        is_active,
        financial_partner:financial_partners(id, name)
      )
    `)
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
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
      product_financial_partners(
        id,
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

import { createClient } from '@/lib/supabase/server'

export async function listFinancialPartners() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_partners')
    .select('id, name, api_base_url, is_active')
    .order('name')
  if (error) throw error
  return data
}

export async function getFinancialPartner(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_partners')
    .select('id, name, api_base_url, api_key_enc, webhook_secret, is_active')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

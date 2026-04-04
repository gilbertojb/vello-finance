import { createClient } from '@/lib/supabase/server'

export async function listFinancialPartners() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_partners')
    .select('id, name, type, api_base_url, is_active')
    .order('name')
  if (error) throw error
  return data
}

export async function getFinancialPartner(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_partners')
    .select('id, name, type, api_base_url, api_key_enc, webhook_secret, is_active')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getCurrentUserRole(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1])) as { role?: string }
    return payload.role ?? null
  } catch {
    return null
  }
}

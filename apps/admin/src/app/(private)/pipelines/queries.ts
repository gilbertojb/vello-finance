import { createClient } from '@/lib/supabase/server'

export async function listPipelines(onlyActive = false) {
  const supabase = await createClient()
  let query = supabase
    .from('product_types')
    .select('id, name, slug, description, is_active, created_at')
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getPipeline(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_types')
    .select('id, name, slug, description, is_active')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

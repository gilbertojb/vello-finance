'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleTenantProduct(id: string, isActive: boolean) {
  const supabase = await createClient()

  // RLS garante que o tenant só pode atualizar seus próprios registros
  const { error } = await supabase
    .from('tenant_products')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/products')
  return { success: true, message: null, errors: null }
}

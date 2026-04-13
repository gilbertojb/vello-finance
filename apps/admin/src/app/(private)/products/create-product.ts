'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

import {
  parseFormDataWithNulls,
  partnerCommissionSchema,
  productSchema,
} from './product-schema'

export async function createProduct(data: FormData) {
  await requireBackofficeUser()

  const obj = parseFormDataWithNulls(data)

  const productResult = productSchema.safeParse(obj)

  if (!productResult.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(productResult.error).fieldErrors,
    }
  }

  // Parsear parceiros selecionados
  const partnerIds = data.getAll('partner_ids') as string[]
  const partnersData = partnerIds.map((id) => ({
    financial_partner_id: id,
    if_commission_pct: data.get(`if_commission_${id}`),
    vello_commission_pct: data.get(`vello_commission_${id}`),
  }))

  const partnersResult = z.array(partnerCommissionSchema).safeParse(partnersData)

  if (!partnersResult.success) {
    return {
      success: false,
      message: 'Verifique as comissões das instituições financeiras.',
      errors: null,
    }
  }

  const supabase = await createClient()

  // Inserir produto e obter id gerado
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productResult.data)
    .select('id')
    .single()

  if (productError) {
    return { success: false, message: productError.message, errors: null }
  }

  // Inserir vínculos com IFs (se houver)
  if (partnersResult.data.length > 0) {
    const rows = partnersResult.data.map((p) => ({
      product_id: product.id,
      financial_partner_id: p.financial_partner_id,
      if_commission_pct: p.if_commission_pct,
      vello_commission_pct: p.vello_commission_pct,
    }))

    const { error: partnersError } = await supabase
      .from('product_financial_partners')
      .insert(rows)

    if (partnersError) {
      return { success: false, message: partnersError.message, errors: null }
    }
  }

  revalidatePath('/products')

  return {
    success: true,
    message: 'Produto cadastrado com sucesso!',
    errors: null,
  }
}

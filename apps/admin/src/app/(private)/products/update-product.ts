'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

import {
  parseFormDataWithNulls,
  partnerCommissionSchema,
  productUpdateSchema,
} from './product-schema'

export async function updateProduct(data: FormData) {
  await requireBackofficeUser()

  const productId = data.get('id') as string
  if (!productId) {
    return { success: false, message: 'ID do produto não informado.', errors: null }
  }

  const obj = parseFormDataWithNulls(data)

  const productResult = productUpdateSchema.safeParse(obj)

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

  const { error: productError } = await supabase
    .from('products')
    .update(productResult.data)
    .eq('id', productId)

  if (productError) {
    return { success: false, message: productError.message, errors: null }
  }

  // Sincronizar vínculos com IFs
  if (partnerIds.length === 0) {
    // Remover todos os vínculos
    const { error } = await supabase
      .from('product_financial_partners')
      .delete()
      .eq('product_id', productId)

    if (error) {
      return { success: false, message: error.message, errors: null }
    }
  } else {
    // Remover IFs que foram desmarcadas
    const { error: deleteError } = await supabase
      .from('product_financial_partners')
      .delete()
      .eq('product_id', productId)
      .not('financial_partner_id', 'in', `(${partnerIds.join(',')})`)

    if (deleteError) {
      return { success: false, message: deleteError.message, errors: null }
    }

    // Inserir/atualizar IFs submetidas
    const rows = partnersResult.data.map((p) => ({
      product_id: productId,
      financial_partner_id: p.financial_partner_id,
      if_commission_pct: p.if_commission_pct,
      vello_commission_pct: p.vello_commission_pct,
    }))

    const { error: upsertError } = await supabase
      .from('product_financial_partners')
      .upsert(rows, { onConflict: 'product_id,financial_partner_id' })

    if (upsertError) {
      return { success: false, message: upsertError.message, errors: null }
    }
  }

  revalidatePath('/products')

  return {
    success: true,
    message: 'Produto atualizado com sucesso!',
    errors: null,
  }
}

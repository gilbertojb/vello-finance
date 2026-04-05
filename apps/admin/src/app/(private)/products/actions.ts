'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const productSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum([
    'fgts',
    'consignado_publico',
    'consignado_privado',
    'home_equity',
    'auto_equity',
    'outros',
  ]),
  description: z.string().optional().nullable(),
  internal_description: z.string().optional().nullable(),
  min_amount: z.coerce.number().optional().nullable(),
  max_amount: z.coerce.number().optional().nullable(),
  min_term_months: z.coerce.number().int().optional().nullable(),
  max_term_months: z.coerce.number().int().optional().nullable(),
  min_rate_monthly: z.coerce.number().optional().nullable(),
  max_rate_monthly: z.coerce.number().optional().nullable(),
  is_active: z.boolean().default(true),
})

const partnerCommissionSchema = z
  .object({
    financial_partner_id: z.string().uuid(),
    if_commission_pct: z.coerce.number().min(0.001).max(100),
    vello_commission_pct: z.coerce.number().min(0).max(100),
  })
  .superRefine((data, ctx) => {
    if (data.vello_commission_pct > data.if_commission_pct) {
      ctx.addIssue({
        code: 'custom',
        message: 'Retenção Vello não pode ser maior que a Comissão da IF',
        path: ['vello_commission_pct'],
      })
    }
  })

export async function createProduct(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>

  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'

  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

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

const productUpdateSchema = productSchema.omit({ type: true })

export async function updateProduct(data: FormData) {
  const productId = data.get('id') as string
  if (!productId) {
    return { success: false, message: 'ID do produto não informado.', errors: null }
  }

  const obj = Object.fromEntries(data) as Record<string, unknown>

  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'

  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

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

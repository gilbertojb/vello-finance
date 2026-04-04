'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const productSchema = z
  .object({
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
    financial_partner_id: z.string().uuid().optional().nullable(),
    min_amount: z.coerce.number().optional().nullable(),
    max_amount: z.coerce.number().optional().nullable(),
    min_term_months: z.coerce.number().int().optional().nullable(),
    max_term_months: z.coerce.number().int().optional().nullable(),
    min_rate_monthly: z.coerce.number().optional().nullable(),
    max_rate_monthly: z.coerce.number().optional().nullable(),
    bank_commission_pct: z.coerce.number().min(0.01).max(100),
    vello_commission_pct: z.coerce.number().min(0).max(100),
    is_active: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.vello_commission_pct > data.bank_commission_pct) {
      ctx.addIssue({
        code: 'custom',
        message: 'Retenção Vello não pode ser maior que a Comissão do Banco',
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

  const result = productSchema.safeParse(obj)

  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors

    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('products').insert(result.data)

  if (error) {
    return { success: false, message: error.message, errors: null }
  }

  revalidatePath('/products')

  return {
    success: true,
    message: 'Produto cadastrado com sucesso!',
    errors: null,
  }
}

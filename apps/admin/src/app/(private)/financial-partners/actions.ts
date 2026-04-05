'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const baseSchema = z.object({
  name: z.string().min(2).max(100),
  api_base_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
  api_key_enc: z.string().optional().nullable(),
  webhook_secret: z.string().optional().nullable(),
})

export async function createFinancialPartner(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const result = baseSchema.safeParse(obj)
  if (!result.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  // TODO: usar @vello/auth para restringir escrita de campos sensíveis por role (super_admin).
  // const sensitiveResult = sensitiveSchema.safeParse(obj)
  // const payload: Record<string, unknown> = { ...baseResult.data }
  // if (sensitiveResult.success) {
  //   if (sensitiveResult.data.api_key_enc)
  //     payload.api_key_enc = sensitiveResult.data.api_key_enc
  //   if (sensitiveResult.data.webhook_secret)
  //     payload.webhook_secret = sensitiveResult.data.webhook_secret
  // }

  const supabase = await createClient()
  const { error } = await supabase
    .from('financial_partners')
    .insert(result.data)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/financial-partners')
  return {
    success: true,
    message: 'Instituição financeira cadastrada com sucesso!',
    errors: null,
  }
}

export async function updateFinancialPartner(data: FormData) {
  const id = data.get('id') as string
  if (!id) return { success: false, message: 'ID não informado.', errors: null }

  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const result = baseSchema.safeParse(obj)
  if (!result.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  // TODO: usar @vello/auth para restringir escrita de campos sensíveis por role (super_admin).
  // Só atualiza se o usuário digitou um novo valor (não deixou o placeholder vazio).
  // const sensitiveResult = sensitiveSchema.safeParse(obj)
  // const payload: Record<string, unknown> = { ...baseResult.data }
  // if (sensitiveResult.success) {
  //   if (sensitiveResult.data.api_key_enc)
  //     payload.api_key_enc = sensitiveResult.data.api_key_enc
  //   if (sensitiveResult.data.webhook_secret)
  //     payload.webhook_secret = sensitiveResult.data.webhook_secret
  // }

  const supabase = await createClient()
  const { error } = await supabase
    .from('financial_partners')
    .update(result.data)
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/financial-partners')
  return {
    success: true,
    message: 'Instituição financeira atualizada com sucesso!',
    errors: null,
  }
}

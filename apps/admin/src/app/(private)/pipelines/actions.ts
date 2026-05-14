'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const pipelineSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'Slug deve conter apenas letras minúsculas, números e underscore'),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export async function createPipeline(data: FormData) {
  await requireBackofficeUser()

  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const parsed = pipelineSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('product_types').insert(parsed.data)

  if (error) {
    const msg =
      error.code === '23505' ? 'Já existe uma esteira com este slug.' : error.message
    return { success: false, message: msg, errors: null }
  }

  revalidatePath('/pipelines')
  return { success: true, message: 'Esteira criada com sucesso!', errors: null }
}

const pipelineUpdateSchema = pipelineSchema.omit({ slug: true })

export async function updatePipeline(data: FormData) {
  await requireBackofficeUser()

  const id = data.get('id') as string
  if (!id) return { success: false, message: 'ID não informado.', errors: null }

  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const parsed = pipelineUpdateSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('product_types')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/pipelines')
  revalidatePath(`/pipelines/${id}/edit`)
  return { success: true, message: 'Esteira atualizada com sucesso!', errors: null }
}

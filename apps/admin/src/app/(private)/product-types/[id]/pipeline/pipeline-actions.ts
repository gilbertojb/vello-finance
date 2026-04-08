'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

// ─── Stage Actions ─────────────────────────────────────────────────────────

const stageSchema = z.object({
  product_type_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  timeout_unit: z.enum(['minutes', 'hours', 'days']).nullable().optional(),
  timeout_value: z.coerce.number().int().positive().nullable().optional(),
})

export async function createStage(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === 'null') obj[key] = null
  }

  const parsed = stageSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const supabase = await createClient()

  const { data: last, error: countError } = await supabase
    .from('proposal_stages')
    .select('order_num')
    .eq('product_type_id', parsed.data.product_type_id)
    .order('order_num', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (countError) return { success: false, message: countError.message, errors: null }

  const nextOrder = (last?.order_num ?? 0) + 1

  const { data: stage, error } = await supabase
    .from('proposal_stages')
    .insert({
      product_type_id: parsed.data.product_type_id,
      name: parsed.data.name,
      order_num: nextOrder,
      timeout_unit: parsed.data.timeout_unit ?? null,
      timeout_value: parsed.data.timeout_value ?? null,
    })
    .select('id, name, order_num, timeout_unit, timeout_value')
    .single()

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath(`/product-types/${parsed.data.product_type_id}/pipeline`)
  return {
    success: true,
    message: 'Etapa criada.',
    errors: null,
    data: stage as Record<string, unknown>,
  }
}

const stageUpdateSchema = z.object({
  stage_id: z.string().uuid(),
  product_type_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  timeout_unit: z.enum(['minutes', 'hours', 'days']).nullable().optional(),
  timeout_value: z.coerce.number().int().positive().nullable().optional(),
})

export async function updateStage(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === 'null') obj[key] = null
  }

  const parsed = stageUpdateSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proposal_stages')
    .update({
      name: parsed.data.name,
      timeout_unit: parsed.data.timeout_unit ?? null,
      timeout_value: parsed.data.timeout_value ?? null,
    })
    .eq('id', parsed.data.stage_id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath(`/product-types/${parsed.data.product_type_id}/pipeline`)
  return { success: true, message: 'Etapa atualizada.', errors: null }
}

export async function deleteStage(stageId: string, productTypeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('proposal_stages')
    .delete()
    .eq('id', stageId)

  if (error) return { success: false, message: error.message }

  revalidatePath(`/product-types/${productTypeId}/pipeline`)
  return { success: true, message: '' }
}

export async function reorderStages(productTypeId: string, orderedIds: string[]) {
  const supabase = await createClient()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('proposal_stages')
      .update({ order_num: index + 1 })
      .eq('id', id),
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)

  if (firstError?.error) return { success: false, message: firstError.error.message }

  revalidatePath(`/product-types/${productTypeId}/pipeline`)
  return { success: true, message: '' }
}

export async function duplicateStagesFrom(
  targetProductTypeId: string,
  sourceProductTypeId: string,
) {
  const supabase = await createClient()

  const { data: sourceStages, error: fetchError } = await supabase
    .from('proposal_stages')
    .select('name, order_num, timeout_unit, timeout_value')
    .eq('product_type_id', sourceProductTypeId)
    .order('order_num')

  if (fetchError) return { success: false, message: fetchError.message }
  if (!sourceStages || sourceStages.length === 0) {
    return { success: false, message: 'Tipo de origem não possui etapas.' }
  }

  const { data: last } = await supabase
    .from('proposal_stages')
    .select('order_num')
    .eq('product_type_id', targetProductTypeId)
    .order('order_num', { ascending: false })
    .limit(1)
    .maybeSingle()

  const offset = last?.order_num ?? 0

  const rows = sourceStages.map((s) => ({
    product_type_id: targetProductTypeId,
    name: s.name,
    order_num: s.order_num + offset,
    timeout_unit: s.timeout_unit,
    timeout_value: s.timeout_value,
  }))

  const { error: insertError } = await supabase.from('proposal_stages').insert(rows)
  if (insertError) return { success: false, message: insertError.message }

  revalidatePath(`/product-types/${targetProductTypeId}/pipeline`)
  return { success: true, message: `${rows.length} etapas duplicadas com sucesso.` }
}

// ─── Trigger Actions ────────────────────────────────────────────────────────

const triggerSchema = z.object({
  stage_id: z.string().uuid(),
  product_type_id: z.string().uuid(),
  event_type: z.enum(['on_enter', 'on_exit', 'on_timeout']),
  webhook_url: z.string().url('URL de webhook inválida.'),
  payload_template: z.string().optional().nullable(),
})

export async function createTrigger(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const parsed = triggerSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os dados do trigger.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  let payloadJson: unknown = null
  if (parsed.data.payload_template) {
    try {
      payloadJson = JSON.parse(parsed.data.payload_template)
    } catch {
      return {
        success: false,
        message: 'Payload template deve ser JSON válido.',
        errors: null,
      }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('stage_triggers').insert({
    stage_id: parsed.data.stage_id,
    event_type: parsed.data.event_type,
    webhook_url: parsed.data.webhook_url,
    payload_template: payloadJson,
  })

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath(`/product-types/${parsed.data.product_type_id}/pipeline`)
  return { success: true, message: 'Trigger criado.', errors: null }
}

export async function deleteTrigger(triggerId: string, productTypeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('stage_triggers')
    .delete()
    .eq('id', triggerId)

  if (error) return { success: false, message: error.message }

  revalidatePath(`/product-types/${productTypeId}/pipeline`)
  return { success: true, message: '' }
}

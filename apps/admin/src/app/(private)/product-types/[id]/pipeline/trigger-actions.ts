'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const triggerSchema = z.object({
  stage_id: z.string().uuid(),
  product_type_id: z.string().uuid(),
  event_type: z.enum(['on_enter', 'on_exit', 'on_timeout']),
  webhook_url: z.string().url('URL de webhook inválida.'),
  payload_template: z.string().optional().nullable(),
  timeout_unit: z.enum(['minutes', 'hours', 'days']).nullable().optional(),
  timeout_value: z.coerce.number().int().positive().nullable().optional(),
})

export async function createTrigger(data: FormData) {
  await requireBackofficeUser()

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
    timeout_unit: parsed.data.timeout_unit ?? null,
    timeout_value: parsed.data.timeout_value ?? null,
    // biome-ignore lint/suspicious/noExplicitAny: payloadJson is a json object
    payload_template: payloadJson as any,
  })

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath(`/product-types/${parsed.data.product_type_id}/pipeline`)
  return { success: true, message: 'Trigger criado.', errors: null }
}

export async function deleteTrigger(triggerId: string, productTypeId: string) {
  await requireBackofficeUser()

  const supabase = await createClient()
  const { error } = await supabase
    .from('stage_triggers')
    .delete()
    .eq('id', triggerId)

  if (error) return { success: false, message: error.message }

  revalidatePath(`/product-types/${productTypeId}/pipeline`)
  return { success: true, message: '' }
}

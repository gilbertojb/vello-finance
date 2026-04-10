'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const settingsSchema = z.object({
  base_color: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
})

export async function updateStoreSettings(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>

  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const result = settingsSchema.safeParse(obj)
  if (!result.success) {
    return { success: false, message: 'Verifique os campos.', errors: null }
  }

  const supabase = await createClient()

  // Buscar tenant_id via RLS — retorna apenas o branding do tenant autenticado
  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('tenant_id')
    .single()

  if (!branding?.tenant_id) {
    return { success: false, message: 'Configurações não encontradas.', errors: null }
  }

  // Atualizar campos de cor
  const { error } = await supabase
    .from('tenant_branding')
    .update({
      ...(result.data.base_color !== null && { base_color: result.data.base_color }),
      ...(result.data.theme_color !== null && { theme_color: result.data.theme_color }),
    })
    .eq('tenant_id', branding.tenant_id)

  if (error) return { success: false, message: error.message, errors: null }

  // Upload de arquivos — apenas se um novo arquivo foi selecionado
  const serviceClient = createServiceClient()

  const uploads: Array<{
    field: string
    path: string
    maxSize: number
    urlField: string
  }> = [
    {
      field: 'logo',
      path: `${branding.tenant_id}/logo`,
      maxSize: 2 * 1024 * 1024,
      urlField: 'logo_url',
    },
    {
      field: 'favicon',
      path: `${branding.tenant_id}/favicon`,
      maxSize: 512 * 1024,
      urlField: 'favicon_url',
    },
  ]

  const uploadUpdates: Record<string, string> = {}

  for (const { field, path, maxSize, urlField } of uploads) {
    const file = data.get(field) as File | null
    if (!file || file.size === 0) continue
    if (file.size > maxSize) continue

    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await serviceClient.storage
      .from('tenant-assets')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = serviceClient.storage.from('tenant-assets').getPublicUrl(path)
      uploadUpdates[urlField] = publicUrl
    }
  }

  if (Object.keys(uploadUpdates).length > 0) {
    await supabase
      .from('tenant_branding')
      .update(uploadUpdates)
      .eq('tenant_id', branding.tenant_id)
  }

  revalidatePath('/store-settings')
  return { success: true, message: 'Configurações salvas com sucesso!', errors: null }
}

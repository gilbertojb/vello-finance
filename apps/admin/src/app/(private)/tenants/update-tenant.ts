'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

import {
  brandingSchema,
  parseFormDataWithNulls,
  sanitizeCss,
  tenantSchema,
} from './tenant-schema'

export async function updateTenant(data: FormData) {
  await requireBackofficeUser()

  const id = data.get('id') as string
  if (!id) return { success: false, message: 'ID não informado.', errors: null }

  const obj = parseFormDataWithNulls(data)

  const tenantResult = tenantSchema.safeParse(obj)
  if (!tenantResult.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(tenantResult.error).fieldErrors,
    }
  }

  const brandingResult = brandingSchema.safeParse(obj)
  if (!brandingResult.success) {
    return {
      success: false,
      message: 'Verifique os campos de identidade visual.',
      errors: null,
    }
  }

  const supabase = await createClient()
  const serviceClient = createServiceClient()

  // contact_name não existe na tabela tenants — atualiza tenant_users.full_name separadamente
  const { contact_name: contactName, ...tenantData } = tenantResult.data

  const { error: tenantError } = await supabase
    .from('tenants')
    .update(tenantData)
    .eq('id', id)

  if (tenantError) {
    return { success: false, message: tenantError.message, errors: null }
  }

  if (contactName) {
    await serviceClient
      .from('tenant_users')
      .update({ full_name: contactName })
      .eq('tenant_id', id)
      .eq('role', 'tenant_admin')
  }

  // Upload de arquivos — apenas se um novo arquivo foi selecionado
  const brandingUpdate: Record<string, string> = {}

  const uploads: Array<{ field: string; path: string; maxSize: number }> = [
    { field: 'logo', path: `${id}/logo`, maxSize: 2 * 1024 * 1024 },
    { field: 'favicon', path: `${id}/favicon`, maxSize: 512 * 1024 },
    { field: 'auth_bg', path: `${id}/auth-bg`, maxSize: 5 * 1024 * 1024 },
  ]

  const urlFields: Record<string, string> = {
    logo: 'logo_url',
    favicon: 'favicon_url',
    auth_bg: 'auth_bg_image_url',
  }

  for (const { field, path, maxSize } of uploads) {
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
      brandingUpdate[urlFields[field]] = publicUrl
    }
  }

  const rawCss = (obj.custom_css as string | null | undefined) || null
  const customCss = rawCss ? sanitizeCss(rawCss) : null

  const brandingScalarPayload = Object.fromEntries(
    Object.entries({ ...brandingResult.data, ...brandingUpdate }).filter(
      ([, v]) => v !== null && v !== undefined,
    ),
  )

  const { error: brandingError } = await supabase
    .from('tenant_branding')
    .update({
      ...brandingScalarPayload,
      ...(customCss !== null ? { custom_css: customCss } : {}),
    })
    .eq('tenant_id', id)

  if (brandingError) {
    return { success: false, message: brandingError.message, errors: null }
  }

  revalidatePath('/tenants')
  revalidatePath(`/tenants/${id}/edit`)

  return {
    success: true,
    message: 'Parceiro atualizado com sucesso!',
    errors: null,
  }
}

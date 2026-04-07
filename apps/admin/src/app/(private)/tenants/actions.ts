'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const tenantSchema = z.object({
  name: z.string().min(2).max(100),
  company_name: z.string().min(2).max(150).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  slug: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  custom_domain: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_agency: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_pix_key: z.string().optional().nullable(),
})

const brandingSchema = z.object({
  company_display_name: z.string().optional().nullable(),
  use_custom_theme: z.preprocess(
    (v) => v === 'on' || v === true,
    z.boolean().default(false),
  ),
  base_color: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
})

export async function createTenant(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>

  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

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

  // Inserir tenant (trigger cria tenant_branding automaticamente)
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      ...tenantResult.data,
      type: 'whitelabel',
      status: 'pending',
    })
    .select('id')
    .single()

  if (tenantError) {
    return { success: false, message: tenantError.message, errors: null }
  }

  // Upload de arquivos para storage
  const serviceClient = createServiceClient()
  const brandingUpdate: Record<string, string> = {}

  const uploads: Array<{ field: string; path: string; maxSize: number }> = [
    { field: 'logo', path: `${tenant.id}/logo`, maxSize: 2 * 1024 * 1024 },
    { field: 'favicon', path: `${tenant.id}/favicon`, maxSize: 512 * 1024 },
    { field: 'auth_bg', path: `${tenant.id}/auth-bg`, maxSize: 5 * 1024 * 1024 },
  ]

  const urlFields: Record<string, string> = {
    logo: 'logo_url',
    favicon: 'favicon_url',
    auth_bg: 'auth_bg_image_url',
  }

  for (const { field, path, maxSize } of uploads) {
    const file = data.get(field) as File | null
    if (!file || file.size === 0) continue

    if (file.size > maxSize) continue // ignora silenciosamente — validação no cliente

    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await serviceClient.storage
      .from('tenant-assets')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (!uploadError) {
      const { data: { publicUrl } } = serviceClient.storage
        .from('tenant-assets')
        .getPublicUrl(path)
      brandingUpdate[urlFields[field]] = publicUrl
    }
  }

  // custom_css é JSONB: { rawCss: "..." } + quaisquer tokens CSS adicionados futuramente
  // O textarea do formulário envia texto plano; aqui embrulhamos como JSONB.
  const rawCss = obj.custom_css as string | null | undefined
  const customCssJson = rawCss ? { rawCss } : null

  // Atualizar tenant_branding — remover nulls (colunas NOT NULL têm defaults)
  const brandingScalarPayload = Object.fromEntries(
    Object.entries({ ...brandingResult.data, ...brandingUpdate }).filter(
      ([, v]) => v !== null && v !== undefined,
    ),
  )

  const { error: brandingError } = await supabase
    .from('tenant_branding')
    .update({
      ...brandingScalarPayload,
      ...(customCssJson !== null ? { custom_css: customCssJson } : {}),
    })
    .eq('tenant_id', tenant.id)

  if (brandingError) {
    return { success: false, message: brandingError.message, errors: null }
  }

  revalidatePath('/tenants')

  return {
    success: true,
    message: 'Parceiro cadastrado com sucesso!',
    errors: null,
  }
}

// ---------------------------------------------------------------------------
// updateTenant
// ---------------------------------------------------------------------------

export async function updateTenant(data: FormData) {
  const id = data.get('id') as string
  if (!id) return { success: false, message: 'ID não informado.', errors: null }

  const obj = Object.fromEntries(data) as Record<string, unknown>

  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

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

  const { error: tenantError } = await supabase
    .from('tenants')
    .update(tenantResult.data)
    .eq('id', id)

  if (tenantError) {
    return { success: false, message: tenantError.message, errors: null }
  }

  // Upload de arquivos — apenas se um novo arquivo foi selecionado
  const serviceClient = createServiceClient()
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
      const { data: { publicUrl } } = serviceClient.storage
        .from('tenant-assets')
        .getPublicUrl(path)
      brandingUpdate[urlFields[field]] = publicUrl
    }
  }

  // custom_css: só atualiza se rawCss foi enviado; preserva tokens existentes caso vazio
  const rawCss = obj.custom_css as string | null | undefined
  const customCssJson = rawCss ? { rawCss } : null

  const brandingScalarPayload = Object.fromEntries(
    Object.entries({ ...brandingResult.data, ...brandingUpdate }).filter(
      ([, v]) => v !== null && v !== undefined,
    ),
  )

  const { error: brandingError } = await supabase
    .from('tenant_branding')
    .update({
      ...brandingScalarPayload,
      ...(customCssJson !== null ? { custom_css: customCssJson } : {}),
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

// ---------------------------------------------------------------------------
// setTenantStatus
// ---------------------------------------------------------------------------

export async function setTenantStatus(
  id: string,
  status: 'active' | 'suspended' | 'cancelled',
) {
  const supabase = await createClient()

  const extra: Record<string, string> = {}
  if (status === 'active') extra.activated_at = new Date().toISOString()
  if (status === 'suspended') extra.suspended_at = new Date().toISOString()

  const { error } = await supabase
    .from('tenants')
    .update({ status, ...extra })
    .eq('id', id)

  if (error) return { success: false, message: error.message }

  revalidatePath('/tenants')
  return { success: true, message: '' }
}

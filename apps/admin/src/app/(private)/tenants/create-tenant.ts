'use server'

import { sendEmail, TenantWelcomeEmail } from '@vello/email'
import { env } from '@vello/env/admin'

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

export async function createTenant(data: FormData) {
  await requireBackofficeUser()

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

  // Separar contact_name (não vai para tabela tenants)
  const { contact_name: contactNameField, ...tenantData } = tenantResult.data
  const contactName = contactNameField ?? tenantData.name

  // Inserir tenant (trigger cria tenant_branding automaticamente)
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      ...tenantData,
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
    {
      field: 'auth_bg',
      path: `${tenant.id}/auth-bg`,
      maxSize: 5 * 1024 * 1024,
    },
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
      const {
        data: { publicUrl },
      } = serviceClient.storage.from('tenant-assets').getPublicUrl(path)
      brandingUpdate[urlFields[field]] = publicUrl
    }
  }

  const rawCss = (obj.custom_css as string | null | undefined) || null
  const customCss = rawCss ? sanitizeCss(rawCss) : null

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
      ...(customCss !== null ? { custom_css: customCss } : {}),
    })
    .eq('tenant_id', tenant.id)

  if (brandingError) {
    return { success: false, message: brandingError.message, errors: null }
  }

  // ---- Onboarding: criar auth user + enviar email ----

  // Criar usuário no Supabase Auth
  const tempPassword = crypto.randomUUID()
  const { data: authUser, error: authError } =
    await serviceClient.auth.admin.createUser({
      email: tenantData.email,
      password: tempPassword,
      email_confirm: true,
    })

  if (authError) {
    revalidatePath('/tenants')
    return {
      success: false,
      message: `Parceiro cadastrado, mas erro ao criar acesso: ${authError.message}`,
      errors: null,
    }
  }

  // Inserir em tenant_users
  await serviceClient.from('tenant_users').insert({
    id: authUser.user.id,
    tenant_id: tenant.id,
    role: 'tenant_admin',
    full_name: contactName,
  })

  // Gerar link de recovery
  const { data: linkData, error: linkError } =
    await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email: tenantData.email,
    })

  if (linkError || !linkData) {
    revalidatePath('/tenants')
    return {
      success: true,
      message:
        'Parceiro cadastrado, mas o email de ativação não pôde ser gerado.',
      errors: null,
    }
  }

  // Construir URL de reset
  const domain =
    tenantData.custom_domain ?? `${tenantData.slug}.${env.CONSOLE_BASE_DOMAIN}`
  const resetUrl = `https://${domain}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`

  // Enviar email
  const { error: emailError } = await sendEmail({
    apiKey: env.RESEND_API_KEY,
    to: tenantData.email,
    subject: 'Bem-vindo à Vello Finance — defina sua senha',
    react: TenantWelcomeEmail({
      contactName,
      resetLink: resetUrl,
    }),
  })

  // Atualizar welcome_email_sent_at
  if (!emailError) {
    await supabase
      .from('tenants')
      .update({ welcome_email_sent_at: new Date().toISOString() })
      .eq('id', tenant.id)
  }

  revalidatePath('/tenants')

  if (emailError) {
    return {
      success: true,
      message:
        'Parceiro cadastrado, mas o email de ativação não pôde ser enviado.',
      errors: null,
    }
  }

  return {
    success: true,
    message: 'Parceiro cadastrado com sucesso!',
    errors: null,
  }
}

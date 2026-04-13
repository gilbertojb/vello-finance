'use server'

import { sendEmail, TenantWelcomeEmail } from '@vello/email'
import { env } from '@vello/env/admin'

import { revalidatePath } from 'next/cache'

import { requireBackofficeUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function setTenantStatus(
  id: string,
  status: 'active' | 'suspended' | 'cancelled',
) {
  await requireBackofficeUser()

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

export async function resendWelcomeEmail(tenantId: string) {
  await requireBackofficeUser()

  const supabase = await createClient()
  const serviceClient = createServiceClient()

  // Buscar tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, email, slug, custom_domain, name')
    .eq('id', tenantId)
    .single()

  if (tenantError || !tenant) {
    return { success: false, message: 'Parceiro não encontrado.' }
  }

  // Buscar tenant_user admin para obter full_name
  const { data: tenantUser } = await serviceClient
    .from('tenant_users')
    .select('id, full_name')
    .eq('tenant_id', tenantId)
    .eq('role', 'tenant_admin')
    .limit(1)
    .single()

  const contactName = tenantUser?.full_name ?? tenant.name

  // Gerar novo link de recovery
  const { data: linkData, error: linkError } =
    await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email: tenant.email,
    })

  if (linkError || !linkData) {
    return { success: false, message: 'Erro ao gerar link de recuperação.' }
  }

  // Construir URL de reset
  const domain =
    tenant.custom_domain ?? `${tenant.slug}.${env.CONSOLE_BASE_DOMAIN}`
  const resetUrl = `https://${domain}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`

  // Enviar email
  const { error: emailError } = await sendEmail({
    apiKey: env.RESEND_API_KEY,
    to: tenant.email,
    subject: 'Bem-vindo à Vello Finance — defina sua senha',
    react: TenantWelcomeEmail({
      contactName,
      resetLink: resetUrl,
    }),
  })

  if (emailError) {
    return { success: false, message: 'Erro ao enviar email de ativação.' }
  }

  // Atualizar welcome_email_sent_at
  await supabase
    .from('tenants')
    .update({ welcome_email_sent_at: new Date().toISOString() })
    .eq('id', tenantId)

  revalidatePath(`/tenants/${tenantId}/edit`)
  revalidatePath('/tenants')

  return { success: true, message: 'Email de ativação reenviado com sucesso!' }
}

'use server'

import { sendEmail, TenantPasswordRecoveryEmail } from '@vello/email'
import { env } from '@vello/env/console'
import { headers } from 'next/headers'
import { z } from 'zod'

import { createServiceClient } from '@/lib/supabase/service'

const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Por favor, informe um e-mail válido.' }),
})

// Mensagem genérica — não revela se o e-mail existe ou não (evita enumeração de usuários)
const SUCCESS_MESSAGE =
  'Se esse e-mail estiver cadastrado, você receberá as instruções em breve.'

export async function requestPasswordReset(data: FormData) {
  const result = forgotPasswordSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    return {
      success: false,
      message: null,
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  const { email } = result.data

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''
  const host = headerStore.get('host') ?? ''

  const serviceClient = createServiceClient()

  // Gerar link de recovery — falha silenciosamente se o e-mail não existe no Auth
  const { data: linkData, error: linkError } =
    await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

  if (linkError || !linkData) {
    return { success: true, message: SUCCESS_MESSAGE, errors: null }
  }

  // Verificar que o usuário pertence ao tenant atual (isolamento multi-tenant)
  const { data: tenantUser } = await serviceClient
    .from('tenant_users')
    .select('id')
    .eq('id', linkData.user.id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (!tenantUser) {
    return { success: true, message: SUCCESS_MESSAGE, errors: null }
  }

  const resetUrl = `https://${host}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`

  await sendEmail({
    apiKey: env.RESEND_API_KEY,
    to: email,
    subject: 'Recuperação de senha',
    react: TenantPasswordRecoveryEmail({ resetLink: resetUrl }),
  })

  return { success: true, message: SUCCESS_MESSAGE, errors: null }
}

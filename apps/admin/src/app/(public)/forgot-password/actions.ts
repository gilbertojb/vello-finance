'use server'

import { z } from 'zod'
import { env } from '@vello/env/admin'
import { sendEmail, PasswordRecoverEmail } from '@vello/email'
import { createServiceClient } from '@/lib/supabase/service'

const forgotPasswordSchema = z.object({
  email: z.email({ message: 'Por favor, informe um e-mail válido.' }),
})

export async function requestPasswordReset(data: FormData) {
  const result = forgotPasswordSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    return {
      success: false,
      message: null,
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  // Sempre retorna sucesso para não revelar se o email existe no sistema.
  const serviceClient = createServiceClient()

  const { data: linkData, error: linkError } =
    await serviceClient.auth.admin.generateLink({
      type: 'recovery',
      email: result.data.email,
    })

  if (linkError || !linkData) {
    // Não revelar se o email existe — retorna sucesso genérico
    return {
      success: true,
      message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
      errors: null,
    }
  }

  // Construir URL de reset usando o token gerado pelo Supabase
  const recoverLink = `${env.NEXT_PUBLIC_APP_URL}/api/auth/confirm?token=${linkData.properties.hashed_token}&type=recovery&next=/reset-password`

  await sendEmail({
    apiKey: env.RESEND_API_KEY,
    to: result.data.email,
    subject: 'Recuperação de Senha — Vello Finance',
    react: PasswordRecoverEmail({
      recoverLink,
      baseUrl: 'https://dash.vellofinance.com.br',
    }),
  })

  return {
    success: true,
    message: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
    errors: null,
  }
}

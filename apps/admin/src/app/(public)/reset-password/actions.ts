'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'A senha deve ter pelo menos 8 caracteres.' })
      .regex(/[A-Z]/, { message: 'A senha deve conter pelo menos uma letra maiúscula.' })
      .regex(/[a-z]/, { message: 'A senha deve conter pelo menos uma letra minúscula.' })
      .regex(/[0-9]/, { message: 'A senha deve conter pelo menos um número.' }),
    password_confirmation: z.string(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'As senhas não coincidem.',
    path: ['password_confirmation'],
  })

export async function resetPassword(data: FormData) {
  const result = resetPasswordSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    return {
      success: false,
      message: null,
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  const supabase = await createClient()

  // Verifica se há sessão ativa (estabelecida pelo exchangeCodeForSession)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      success: false,
      message: 'Sessão expirada. Solicite um novo link de recuperação.',
      errors: null,
    }
  }

  const { error } = await supabase.auth.updateUser({
    password: result.data.password,
  })

  if (error) {
    return {
      success: false,
      message: error.message,
      errors: null,
    }
  }

  return {
    success: true,
    message: 'Senha alterada com sucesso!',
    errors: null,
  }
}

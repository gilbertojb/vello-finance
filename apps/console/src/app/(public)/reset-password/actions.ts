'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    type: z.literal('recovery'),
    password: z
      .string()
      .min(8, { message: 'A senha deve ter no mínimo 8 caracteres.' }),
    confirm_password: z.string().min(1, { message: 'Confirme sua senha.' }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'As senhas não coincidem.',
    path: ['confirm_password'],
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

  const { token, type, password } = result.data

  const supabase = await createClient()

  const { error: otpError } = await supabase.auth.verifyOtp({
    token_hash: token,
    type,
  })

  if (otpError) {
    return {
      success: false,
      message: 'Link inválido ou expirado. Solicite um novo.',
      errors: null,
      data: { code: 'TOKEN_INVALID' },
    }
  }

  const { error: updateError } = await supabase.auth.updateUser({ password })

  if (updateError) {
    return {
      success: false,
      message: updateError.message,
      errors: null,
    }
  }

  redirect('/')
}

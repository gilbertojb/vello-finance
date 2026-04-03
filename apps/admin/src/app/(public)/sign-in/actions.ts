'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const signInSchema = z.object({
  email: z.string().email({ message: 'Por favor, informe um e-mail válido.' }),
  password: z.string().min(1, { message: 'Por favor, informe sua senha.' }),
})

export async function signInWithEmailAndPassword(data: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    const errors = z.flattenError(result.error).fieldErrors
    return { success: false, message: null, errors }
  }

  const { email, password } = result.data

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      success: false,
      message: 'E-mail ou senha incorretos.',
      errors: null,
    }
  }

  // @supabase/ssr gerencia os cookies de sessão automaticamente.
  // O redirect acontece no cliente via useFormState onSuccess callback.
  return { success: true, message: null, errors: null }
}

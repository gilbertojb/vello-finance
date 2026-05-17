'use server'

import { userSchema } from '@vello/auth'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { auth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const createUserSchema = z.object({
  email: z.string().email('Email inválido.'),
  full_name: z.string().min(2, 'Mínimo 2 caracteres.').max(100),
  role: z.enum(['super_admin', 'admin', 'financial', 'support']),
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, 'Mínimo 2 caracteres.').max(100),
  role: z.enum(['super_admin', 'admin', 'financial', 'support']),
  is_active: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
  password: z.string().min(8, 'Mínimo 8 caracteres.').optional().or(z.literal('')),
})

export async function createUser(data: FormData) {
  const { ability } = await auth()

  if (!ability.can('create', 'User')) {
    return { success: false, message: 'Sem permissão para criar usuários.', errors: null }
  }

  const obj = Object.fromEntries(data)
  const parsed = createUserSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const serviceClient = createServiceClient()

  const { data: authUser, error: authError } =
    await serviceClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    })

  if (authError) {
    return { success: false, message: authError.message, errors: null }
  }

  const supabase = await createClient()
  const { error: insertError } = await supabase
    .from('backoffice_users')
    .insert({
      id: authUser.user.id,
      role: parsed.data.role,
      full_name: parsed.data.full_name,
    })

  if (insertError) {
    // Rollback: remover usuário criado no auth
    await serviceClient.auth.admin.deleteUser(authUser.user.id)
    return { success: false, message: insertError.message, errors: null }
  }

  revalidatePath('/users')
  return { success: true, message: 'Usuário criado com sucesso!', errors: null }
}

export async function updateUser(data: FormData) {
  const { ability } = await auth()

  if (!ability.can('update', 'User')) {
    return { success: false, message: 'Sem permissão para editar usuários.', errors: null }
  }

  const obj = Object.fromEntries(data)
  const parsed = updateUserSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const { id, password, ...updateData } = parsed.data

  // Verificar anti-self para toggle de is_active
  const supabase = await createClient()
  const { data: current } = await supabase
    .from('backoffice_users')
    .select('id, user_role:role, is_active')
    .eq('id', id)
    .single()

  if (current && current.is_active !== updateData.is_active) {
    const targetUser = userSchema.parse({ id, user_role: current.user_role })
    if (!ability.can('deactivate', targetUser)) {
      return { success: false, message: 'Não é possível alterar seu próprio status.', errors: null }
    }
  }

  const { error: updateError } = await supabase
    .from('backoffice_users')
    .update({
      full_name: updateData.full_name,
      role: updateData.role,
      is_active: updateData.is_active,
    })
    .eq('id', id)

  if (updateError) {
    return { success: false, message: updateError.message, errors: null }
  }

  // Atualizar senha se preenchida
  if (password && password.length >= 8) {
    const serviceClient = createServiceClient()
    const { error: pwError } = await serviceClient.auth.admin.updateUserById(id, { password })
    if (pwError) {
      return { success: false, message: `Dados atualizados, mas erro ao alterar senha: ${pwError.message}`, errors: null }
    }
  }

  revalidatePath('/users')
  revalidatePath(`/users/${id}/edit`)
  return { success: true, message: 'Usuário atualizado com sucesso!', errors: null }
}

export async function deleteUser(id: string) {
  const { ability } = await auth()

  // Buscar target para verificar CASL com condition
  const supabase = await createClient()
  const { data: target } = await supabase
    .from('backoffice_users')
    .select('id, user_role:role')
    .eq('id', id)
    .single()

  if (!target) {
    return { success: false, message: 'Usuário não encontrado.', errors: null }
  }

  const targetUser = userSchema.parse({ id: target.id, user_role: target.user_role })
  if (!ability.can('delete', targetUser)) {
    return { success: false, message: 'Sem permissão para excluir este usuário.', errors: null }
  }

  const { error: deleteError } = await supabase
    .from('backoffice_users')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return { success: false, message: deleteError.message, errors: null }
  }

  const serviceClient = createServiceClient()
  await serviceClient.auth.admin.deleteUser(id)

  revalidatePath('/users')
  return { success: true, message: 'Usuário excluído com sucesso!', errors: null }
}

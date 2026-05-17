'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type ActionResult = { success: boolean; message: string | null; errors: Record<string, string[]> | null }

const createUserSchema = z.object({
  email: z.string().email('Email inválido.'),
  full_name: z.string().min(2, 'Mínimo 2 caracteres.').max(100).optional(),
  role: z.string().min(1, 'Perfil é obrigatório.'),
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
})

const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Mínimo 2 caracteres.').max(100).optional(),
  role: z.string().min(1, 'Perfil é obrigatório.'),
  password: z.string().min(8).optional().or(z.literal('')),
})

export async function createTenantUser(formData: FormData): Promise<ActionResult> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return { success: false, message: 'Conta não identificada.', errors: null }

  const raw = {
    email:     (formData.get('email') as string | null)?.trim() ?? '',
    full_name: (formData.get('full_name') as string | null)?.trim() ?? '',
    role:      (formData.get('role') as string | null) ?? '',
    password:  (formData.get('password') as string | null)?.trim() ?? '',
  }

  const parsed = createUserSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { email, full_name, role, password } = parsed.data

  const supabase      = await createClient()
  const serviceClient = createServiceClient()

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return { success: false, message: authError.message, errors: null }

  const userId = authData.user.id

  const { error: dbError } = await supabase
    .from('tenant_users')
    .insert({
      id:        userId,
      tenant_id: tenantId,
      role:      role as 'tenant_admin' | 'tenant_operator',
      full_name: full_name || null,
      email,
      is_active: true,
    })

  if (dbError) {
    await serviceClient.auth.admin.deleteUser(userId)
    return { success: false, message: dbError.message, errors: null }
  }

  revalidatePath('/usuarios')
  return { success: true, message: 'Usuário criado com sucesso!', errors: null }
}

export async function updateTenantUser(userId: string, formData: FormData): Promise<ActionResult> {
  const raw = {
    full_name: (formData.get('full_name') as string | null)?.trim() ?? '',
    role:      (formData.get('role') as string | null) ?? '',
    password:  (formData.get('password') as string | null)?.trim() ?? '',
  }

  const parsed = updateUserSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { full_name, role, password } = parsed.data

  const supabase      = await createClient()
  const serviceClient = createServiceClient()

  if (password) {
    const { error } = await serviceClient.auth.admin.updateUserById(userId, { password })
    if (error) return { success: false, message: error.message, errors: null }
  }

  const { error } = await supabase
    .from('tenant_users')
    .update({
      full_name: full_name || null,
      role: role as 'tenant_admin' | 'tenant_operator',
    })
    .eq('id', userId)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/usuarios')
  return { success: true, message: 'Usuário atualizado.', errors: null }
}

export async function toggleTenantUser(userId: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tenant_users')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/usuarios')
  return { success: true, message: null, errors: null }
}

export async function deleteTenantUser(userId: string): Promise<ActionResult> {
  const supabase      = await createClient()
  const serviceClient = createServiceClient()

  const { data: target } = await supabase
    .from('tenant_users')
    .select('id')
    .eq('id', userId)
    .single()

  if (!target) return { success: false, message: 'Usuário não encontrado.', errors: null }

  const { error } = await serviceClient.auth.admin.deleteUser(userId)
  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/usuarios')
  return { success: true, message: null, errors: null }
}

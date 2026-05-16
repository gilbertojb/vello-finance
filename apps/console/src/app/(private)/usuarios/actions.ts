'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

type ActionResult = { success: boolean; message: string | null }

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

async function getTenantId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const claims = session?.access_token ? decodeJwtPayload(session.access_token) : null
  return (claims?.tenant_id as string) ?? null
}

export async function createTenantUser(formData: FormData): Promise<ActionResult> {
  const email    = (formData.get('email') as string).trim()
  const fullName = (formData.get('full_name') as string).trim()
  const role     = formData.get('role') as string
  const password = (formData.get('password') as string).trim()

  if (!email || !password || !role) {
    return { success: false, message: 'Email, senha e perfil são obrigatórios.' }
  }

  const supabase      = await createClient()
  const serviceClient = createServiceClient()

  const tenantId = await getTenantId()
  if (!tenantId) return { success: false, message: 'Conta não identificada.' }

  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (authError) return { success: false, message: authError.message }

  const userId = authData.user.id

  const { error: dbError } = await supabase
    .from('tenant_users')
    .insert({
      id:        userId,
      tenant_id: tenantId,
      role:      role as 'tenant_admin' | 'tenant_operator',
      full_name: fullName || null,
      email,
      is_active: true,
    })

  if (dbError) {
    await serviceClient.auth.admin.deleteUser(userId)
    return { success: false, message: dbError.message }
  }

  revalidatePath('/usuarios')
  return { success: true, message: 'Usuário criado com sucesso!' }
}

export async function updateTenantUser(userId: string, formData: FormData): Promise<ActionResult> {
  const fullName = (formData.get('full_name') as string).trim()
  const role     = formData.get('role') as string
  const password = (formData.get('password') as string | null)?.trim() ?? ''

  const supabase      = await createClient()
  const serviceClient = createServiceClient()

  if (password) {
    const { error } = await serviceClient.auth.admin.updateUserById(userId, { password })
    if (error) return { success: false, message: error.message }
  }

  const { error } = await supabase
    .from('tenant_users')
    .update({
      full_name: fullName || null,
      role: role as 'tenant_admin' | 'tenant_operator',
    })
    .eq('id', userId)

  if (error) return { success: false, message: error.message }

  revalidatePath('/usuarios')
  return { success: true, message: 'Usuário atualizado.' }
}

export async function toggleTenantUser(userId: string, isActive: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('tenant_users')
    .update({ is_active: isActive })
    .eq('id', userId)

  if (error) return { success: false, message: error.message }

  revalidatePath('/usuarios')
  return { success: true, message: null }
}

export async function deleteTenantUser(userId: string): Promise<ActionResult> {
  const supabase      = await createClient()
  const serviceClient = createServiceClient()

  const { data: target } = await supabase
    .from('tenant_users')
    .select('id')
    .eq('id', userId)
    .single()

  if (!target) return { success: false, message: 'Usuário não encontrado.' }

  const { error } = await serviceClient.auth.admin.deleteUser(userId)
  if (error) return { success: false, message: error.message }

  revalidatePath('/usuarios')
  return { success: true, message: null }
}

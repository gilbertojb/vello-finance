'use server'

import { getJwtClaims, hasBackofficeAccess } from '@vello/auth'

import { createClient } from '@/lib/supabase/server'

export async function requireBackofficeUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error('Não autenticado.')
  }

  const claims = getJwtClaims(data.user)

  if (!claims || !hasBackofficeAccess(claims.user_role)) {
    throw new Error('Acesso negado: permissão de backoffice necessária.')
  }

  return { user: data.user, claims }
}

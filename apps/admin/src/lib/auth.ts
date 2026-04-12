'use server'

import { defineAbilityFor, hasBackofficeAccess, jwtClaimsSchema, userSchema } from '@vello/auth'

import { createClient } from '@/lib/supabase/server'

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

export async function requireBackofficeUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error('Não autenticado.')
  }

  // Claims do hook estão no JWT, não no app_metadata do banco.
  const { data: { session } } = await supabase.auth.getSession()
  const jwtPayload = session?.access_token
    ? decodeJwtPayload(session.access_token)
    : null

  const parsed = jwtPayload ? jwtClaimsSchema.safeParse(jwtPayload) : null
  const claims = parsed?.success ? parsed.data : null

  if (!claims || !hasBackofficeAccess(claims.user_role)) {
    throw new Error('Acesso negado: permissão de backoffice necessária.')
  }

  return { user: data.user, claims }
}

export async function ability() {
  const { user, claims } = await requireBackofficeUser()

  const ability = defineAbilityFor(
    userSchema.parse({ id: user.id, user_role: claims.user_role }),
  )

  return ability
}

export async function auth() {
  const { user, claims } = await requireBackofficeUser()

  const permissions = defineAbilityFor(
    userSchema.parse({ id: user.id, user_role: claims.user_role }),
  )

  return { user, claims, ability: permissions }
}

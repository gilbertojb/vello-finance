import { z } from 'zod'

import { type Role, roleSchema } from './role'

export const jwtClaimsSchema = z.object({
  user_role: roleSchema,
  tenant_id: z.string().uuid().nullable(), // null = usuário do backoffice
})

export type JwtClaims = z.infer<typeof jwtClaimsSchema>

export function isBackofficeRole(role: Role): boolean {
  return ['super_admin', 'admin', 'financial', 'support'].includes(role)
}

export function isTenantRole(role: Role): boolean {
  return ['tenant_admin', 'tenant_operator'].includes(role)
}

export function isSuperAdmin(role: Role): boolean {
  return role === 'super_admin'
}

export function hasBackofficeAccess(role: Role): boolean {
  return isBackofficeRole(role)
}

export function hasTenantAccess(role: Role): boolean {
  return isTenantRole(role)
}

// Extrai claims do usuário autenticado a partir do app_metadata (server-side)
export function getJwtClaims(
  user: { app_metadata?: Record<string, unknown> } | null,
): JwtClaims | null {
  if (!user?.app_metadata) return null
  const parsed = jwtClaimsSchema.safeParse(user.app_metadata)
  if (!parsed.success) return null
  return parsed.data
}

// Verifica se o usuário é do backoffice (qualquer role interno)
export function isBackoffice(claims: JwtClaims | null): boolean {
  if (!claims) return false
  return isBackofficeRole(claims.user_role)
}

// Verifica se o usuário possui um dos roles especificados
export function hasRole(claims: JwtClaims | null, roles: Role[]): boolean {
  if (!claims) return false
  return roles.includes(claims.user_role)
}

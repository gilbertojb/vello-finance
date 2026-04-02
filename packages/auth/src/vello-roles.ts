import { z } from 'zod'

// Roles do backoffice interno (Vello Admin)
export const backofficeRoleSchema = z.union([
  z.literal('super_admin'),
  z.literal('admin'),
  z.literal('financial'),
  z.literal('support'),
])
export type BackofficeRole = z.infer<typeof backofficeRoleSchema>

// Roles dos tenants (Vello Console)
export const tenantRoleSchema = z.union([
  z.literal('tenant_admin'),
  z.literal('tenant_operator'),
])
export type TenantRole = z.infer<typeof tenantRoleSchema>

// União de todos os roles do sistema
export const systemRoleSchema = z.union([backofficeRoleSchema, tenantRoleSchema])
export type SystemRole = z.infer<typeof systemRoleSchema>

// Claims JWT injetados pelo Supabase Auth Hook
export const jwtClaimsSchema = z.object({
  role: systemRoleSchema,
  tenant_id: z.string().uuid().nullable(), // null = usuário do backoffice
})
export type JwtClaims = z.infer<typeof jwtClaimsSchema>

// Helpers de verificação
export function isBackofficeRole(role: SystemRole): role is BackofficeRole {
  return backofficeRoleSchema.safeParse(role).success
}

export function isTenantRole(role: SystemRole): role is TenantRole {
  return tenantRoleSchema.safeParse(role).success
}

export function isSuperAdmin(role: SystemRole): boolean {
  return role === 'super_admin'
}

export function hasBackofficeAccess(role: SystemRole): boolean {
  return isBackofficeRole(role)
}

export function hasTenantAccess(role: SystemRole): boolean {
  return isTenantRole(role)
}

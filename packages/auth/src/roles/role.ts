import { z } from 'zod'

export const roleSchema = z.union([
  z.literal('super_admin'),
  z.literal('admin'),
  z.literal('financial'),
  z.literal('support'),
  z.literal('tenant_admin'),
  z.literal('tenant_operator'),
])

export type Role = z.infer<typeof roleSchema>

import { z } from 'zod'

import { roleSchema } from '../roles'

export const userSchema = z.object({
  id: z.string(),
  user_role: roleSchema,
  tenant_id: z.string().uuid().nullable().optional(),
})

export type User = z.infer<typeof userSchema>

import { z } from 'zod'

export const tenantSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.literal('Tenant'),
])

export type TenantSubject = z.infer<typeof tenantSubject>

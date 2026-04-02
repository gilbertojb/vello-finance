import { z } from 'zod'

export const planSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.literal('Plan'),
])

export type PlanSubject = z.infer<typeof planSubject>

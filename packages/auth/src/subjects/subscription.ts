import { z } from 'zod'

export const subscriptionSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('create'),
    z.literal('get'),
  ]),
  z.literal('Subscription'),
])

export type SubscriptionSubject = z.infer<typeof subscriptionSubject>

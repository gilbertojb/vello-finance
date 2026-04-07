import { z } from 'zod'

export const financialPartnerSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.literal('FinancialPartner'),
])

export type FinancialPartnerSubject = z.infer<typeof financialPartnerSubject>

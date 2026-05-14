import { z } from 'zod'

export function parseBrNumber(val: unknown): unknown {
  if (typeof val !== 'string' || val === '') return val
  const n = val.includes(',')
    ? parseFloat(val.replace(/\./g, '').replace(',', '.'))
    : parseFloat(val)
  return isNaN(n) ? val : n
}

export const PRODUCT_CATEGORIES = ['pessoa_fisica', 'pessoa_juridica', 'financiamentos'] as const
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  pessoa_fisica: 'Pessoa Física',
  pessoa_juridica: 'Pessoa Jurídica',
  financiamentos: 'Financiamentos',
}

export const productSchema = z.object({
  name: z.string().min(3).max(100),
  product_type_id: z
    .string()
    .regex(
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
      'Tipo de produto inválido.',
    ),
  category: z.enum(PRODUCT_CATEGORIES, {
    error: 'Categoria inválida.',
  }),
  description: z.string().optional().nullable(),
  internal_description: z.string().optional().nullable(),
  min_amount: z.preprocess(parseBrNumber, z.number().optional().nullable()),
  max_amount: z.preprocess(parseBrNumber, z.number().optional().nullable()),
  min_term_months: z.coerce.number().int().optional().nullable(),
  max_term_months: z.coerce.number().int().optional().nullable(),
  min_rate_monthly: z.preprocess(parseBrNumber, z.number().optional().nullable()),
  max_rate_monthly: z.preprocess(parseBrNumber, z.number().optional().nullable()),
  is_active: z.boolean().default(true),
})

export const productUpdateSchema = productSchema.omit({ product_type_id: true })

export const partnerCommissionSchema = z
  .object({
    financial_partner_id: z.string().uuid(),
    if_commission_pct: z.preprocess(parseBrNumber, z.number().min(0.001).max(100)),
    vello_commission_pct: z.preprocess(parseBrNumber, z.number().min(0).max(100)),
  })
  .superRefine((data, ctx) => {
    if (data.vello_commission_pct > data.if_commission_pct) {
      ctx.addIssue({
        code: 'custom',
        message: 'Retenção Vello não pode ser maior que a Comissão da IF',
        path: ['vello_commission_pct'],
      })
    }
  })

export function parseFormDataWithNulls(data: FormData): Record<string, unknown> {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }
  return obj
}

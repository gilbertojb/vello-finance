export type Partner = { id: string; name: string }
export type ProductType = { id: string; name: string; slug: string }

export type ProductWithPartners = {
  id: string
  name: string
  product_type_id: string
  product_type: { id: string; name: string; slug: string } | null
  description: string | null
  internal_description: string | null
  min_amount: number | null
  max_amount: number | null
  min_term_months: number | null
  max_term_months: number | null
  min_rate_monthly: number | null
  max_rate_monthly: number | null
  is_active: boolean
  product_financial_partners: Array<{
    financial_partner_id: string
    if_commission_pct: number
    vello_commission_pct: number
  }>
}

type FormFieldError = { message?: string }

export type FormErrors = Record<string, FormFieldError[]> | null | undefined

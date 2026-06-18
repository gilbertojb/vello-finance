import { z } from 'zod'

export const tenantSchema = z.object({
  name: z.string().min(2).max(100),
  company_name: z.string().min(2).max(150).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug deve conter apenas letras minúsculas, números e hífens',
    ),
  custom_domain: z
    .string()
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
      'Domínio inválido. Use apenas o hostname, sem protocolo ou barra (ex: creditos.empresa.com.br)',
    )
    .optional()
    .nullable(),
  console_custom_domain: z
    .string()
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
      'Domínio inválido. Use apenas o hostname, sem protocolo ou barra (ex: painel.empresa.com.br)',
    )
    .optional()
    .nullable(),
  contact_name: z.string().min(2).max(100).optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_agency: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_pix_key: z.string().optional().nullable(),
})

export const brandingSchema = z.object({
  company_display_name: z.string().optional().nullable(),
  use_custom_theme: z.preprocess(
    (v) => v === 'on' || v === true,
    z.boolean().default(false),
  ),
  base_color: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
})

const FORBIDDEN_CSS_PATTERNS = [
  /url\s*\(/i,
  /@import/i,
  /expression\s*\(/i,
  /javascript\s*:/i,
  /-moz-binding/i,
  /behavior\s*:/i,
]

export function sanitizeCss(css: string): string | null {
  for (const pattern of FORBIDDEN_CSS_PATTERNS) {
    if (pattern.test(css)) return null
  }
  return css
}

export function parseFormDataWithNulls(data: FormData): Record<string, unknown> {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }
  return obj
}

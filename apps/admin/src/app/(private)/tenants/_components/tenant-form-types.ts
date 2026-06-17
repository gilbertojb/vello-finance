type BrandingData = {
  company_display_name: string | null
  use_custom_theme: boolean
  base_color: string | null
  theme_color: string | null
  custom_css: string | null
  logo_url: string | null
  favicon_url: string | null
  auth_bg_image_url: string | null
}

export type TenantForEdit = {
  id: string
  name: string
  company_name: string | null
  cnpj: string | null
  email: string
  phone: string | null
  slug: string
  custom_domain: string | null
  console_custom_domain: string | null
  bank_name: string | null
  bank_agency: string | null
  bank_account: string | null
  bank_pix_key: string | null
  tenant_branding: BrandingData[] | BrandingData | null
  tenant_users: Array<{ full_name: string | null }> | null
}

type FormFieldError = { message?: string }

export type FormErrors = Record<string, FormFieldError[]> | null | undefined

export const BASE_COLOR_OPTIONS = [
  { value: '', label: 'Padrão do sistema', className: '' },
  { value: 'slate', label: 'Slate', className: 'bg-slate-500' },
  { value: 'gray', label: 'Gray', className: 'bg-gray-500' },
  { value: 'zinc', label: 'Zinc', className: 'bg-zinc-500' },
  { value: 'neutral', label: 'Neutral', className: 'bg-neutral-500' },
  { value: 'stone', label: 'Stone', className: 'bg-stone-500' },
]

export const THEME_COLOR_OPTIONS = [
  { value: '', label: 'Padrão do sistema', className: '' },
  { value: '#ef4444', label: 'Vermelho', className: 'bg-red-500' },
  { value: '#f97316', label: 'Laranja', className: 'bg-orange-500' },
  { value: '#f59e0b', label: 'Âmbar', className: 'bg-amber-500' },
  { value: '#eab308', label: 'Amarelo', className: 'bg-yellow-500' },
  { value: '#84cc16', label: 'Lima', className: 'bg-lime-500' },
  { value: '#22c55e', label: 'Verde', className: 'bg-green-500' },
  { value: '#10b981', label: 'Esmeralda', className: 'bg-emerald-500' },
  { value: '#14b8a6', label: 'Teal', className: 'bg-teal-500' },
  { value: '#06b6d4', label: 'Ciano', className: 'bg-cyan-500' },
  { value: '#0ea5e9', label: 'Céu', className: 'bg-sky-500' },
  { value: '#3b82f6', label: 'Azul', className: 'bg-blue-500' },
  { value: '#6366f1', label: 'Índigo', className: 'bg-indigo-500' },
  { value: '#8b5cf6', label: 'Violeta', className: 'bg-violet-500' },
  { value: '#a855f7', label: 'Roxo', className: 'bg-purple-500' },
  { value: '#d946ef', label: 'Fúcsia', className: 'bg-fuchsia-500' },
  { value: '#ec4899', label: 'Rosa', className: 'bg-pink-500' },
  { value: '#f43f5e', label: 'Rosé', className: 'bg-rose-500' },
]

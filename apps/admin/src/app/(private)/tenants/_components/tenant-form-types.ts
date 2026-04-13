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
  bank_name: string | null
  bank_agency: string | null
  bank_account: string | null
  bank_pix_key: string | null
  tenant_branding: BrandingData[] | BrandingData | null
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
  { value: 'red', label: 'Red', className: 'bg-red-500' },
  { value: 'orange', label: 'Orange', className: 'bg-orange-500' },
  { value: 'amber', label: 'Amber', className: 'bg-amber-500' },
  { value: 'yellow', label: 'Yellow', className: 'bg-yellow-500' },
  { value: 'lime', label: 'Lime', className: 'bg-lime-500' },
  { value: 'green', label: 'Green', className: 'bg-green-500' },
  { value: 'emerald', label: 'Emerald', className: 'bg-emerald-500' },
  { value: 'teal', label: 'Teal', className: 'bg-teal-500' },
  { value: 'cyan', label: 'Cyan', className: 'bg-cyan-500' },
  { value: 'sky', label: 'Sky', className: 'bg-sky-500' },
  { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
  { value: 'indigo', label: 'Indigo', className: 'bg-indigo-500' },
  { value: 'violet', label: 'Violet', className: 'bg-violet-500' },
  { value: 'purple', label: 'Purple', className: 'bg-purple-500' },
  { value: 'fuchsia', label: 'Fuchsia', className: 'bg-fuchsia-500' },
  { value: 'pink', label: 'Pink', className: 'bg-pink-500' },
  { value: 'rose', label: 'Rose', className: 'bg-rose-500' },
]

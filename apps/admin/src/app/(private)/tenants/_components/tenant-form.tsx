'use client'

import { Building2, CreditCard, Loader2, Palette, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { ImageUpload } from '@/components/ui/image-upload'
import { Input } from '@/components/ui/input'
import { PhoneInput } from '@/components/ui/masked-input'
import { Switch } from '@/components/ui/switch'
import { useFormState } from '@/hooks/use-form-state'

import { createTenant, updateTenant } from '../actions'

// ---------------------------------------------------------------------------
// Tipo do tenant no modo de edição (retornado por getTenant)
// ---------------------------------------------------------------------------

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

type Props = {
  tenant?: TenantForEdit
}

import {
  fetchCnpjData,
  formatPhone,
  maskCnpj,
  normalizeBranding,
  slugify,
  validateCnpj,
} from '@/lib/helpers'

const BASE_COLOR_OPTIONS = [
  { value: '', label: 'Padrão do sistema', className: '' },
  { value: 'slate', label: 'Slate', className: 'bg-slate-500' },
  { value: 'gray', label: 'Gray', className: 'bg-gray-500' },
  { value: 'zinc', label: 'Zinc', className: 'bg-zinc-500' },
  { value: 'neutral', label: 'Neutral', className: 'bg-neutral-500' },
  { value: 'stone', label: 'Stone', className: 'bg-stone-500' },
]

const THEME_COLOR_OPTIONS = [
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TenantForm({ tenant }: Props) {
  const router = useRouter()
  const isEdit = !!tenant
  const branding = normalizeBranding(tenant?.tenant_branding ?? null)

  // Slug: em edição, considera já editado manualmente para não ser sobrescrito
  const slugManuallyEdited = useRef(isEdit)
  const [slug, setSlug] = useState(tenant?.slug ?? '')

  // CNPJ: só dispara auto-fill se o usuário editou o campo (cnpjDirty)
  const cnpjDirty = useRef(false)
  const [cnpj, setCnpj] = useState(maskCnpj(tenant?.cnpj ?? ''))
  const [isFetchingCnpj, setIsFetchingCnpj] = useState(false)
  const [cnpjLookupError, setCnpjLookupError] = useState<string | null>(null)

  // Campos auto-preenchíveis
  const [name, setName] = useState(tenant?.name ?? '')
  const [companyName, setCompanyName] = useState(tenant?.company_name ?? '')
  const [email, setEmail] = useState(tenant?.email ?? '')
  const [phone, setPhone] = useState(formatPhone(tenant?.phone ?? ''))

  // Identidade visual
  const [isWhiteLabel, setIsWhiteLabel] = useState(
    branding?.use_custom_theme ?? false,
  )

  const action = isEdit ? updateTenant : createTenant

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(
        isEdit
          ? 'Parceiro atualizado com sucesso!'
          : 'Parceiro cadastrado com sucesso!',
      )
      router.push('/tenants')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    cnpjDirty.current = true
    setCnpj(maskCnpj(e.target.value))
    setCnpjLookupError(null)
  }

  async function handleCnpjBlur() {
    if (!cnpjDirty.current || !validateCnpj(cnpj)) return

    setIsFetchingCnpj(true)
    setCnpjLookupError(null)

    try {
      const data = await fetchCnpjData(cnpj)

      if (data.name && !slugManuallyEdited.current) setSlug(slugify(data.name))

      setName(data.name)
      setCompanyName(data.companyName)
      setEmail(data.email)
      setPhone(data.phone)
    } catch {
      setCnpjLookupError('CNPJ não encontrado na Receita Federal.')
    } finally {
      setIsFetchingCnpj(false)
    }
  }

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value)
    if (!slugManuallyEdited.current) setSlug(slugify(e.target.value))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugManuallyEdited.current = true
    setSlug(e.target.value)
  }

  const customCssDefault = branding?.custom_css ?? ''

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={tenant.id} />}

      {/* Card 1 — Dados da Empresa */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-muted-foreground" />
            <CardTitle>Dados da Empresa</CardTitle>
          </div>
          <CardDescription>Informações principais do parceiro.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field className="md:col-span-2">
              <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
              <div className="relative">
                <Input
                  id="cnpj"
                  name="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={cnpj}
                  onChange={handleCnpjChange}
                  onBlur={handleCnpjBlur}
                  disabled={isFetchingCnpj}
                />
                {isFetchingCnpj && (
                  <Loader2 className="absolute right-2.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                )}
              </div>
              {cnpjLookupError && (
                <p className="text-xs text-destructive mt-1">
                  {cnpjLookupError}
                </p>
              )}
              <FieldError errors={formState.errors?.cnpj} />
            </Field>

            <Field>
              <FieldLabel htmlFor="name">Nome Fantasia *</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: Crédito Fácil"
                value={name}
                onChange={handleNameChange}
              />
              <FieldError errors={formState.errors?.name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="company_name">Razão Social</FieldLabel>
              <Input
                id="company_name"
                name="company_name"
                placeholder="Ex: Crédito Fácil Ltda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
              <FieldError errors={formState.errors?.company_name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">E-mail de Contato *</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="contato@empresa.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FieldError errors={formState.errors?.email} />
            </Field>

            <Field>
              <FieldLabel htmlFor="contact_name">Nome do Contato *</FieldLabel>
              <Input
                id="contact_name"
                name="contact_name"
                required
                placeholder="Nome da pessoa de contato"
              />
              <FieldError errors={formState.errors?.contact_name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Telefone</FieldLabel>
              <PhoneInput
                id="phone"
                name="phone"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPhone(e.target.value)
                }
              />
              <FieldError errors={formState.errors?.phone} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 2 — Configurações da Loja */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Store className="size-5 text-muted-foreground" />
            <CardTitle>Configurações da Loja</CardTitle>
          </div>
          <CardDescription>
            URL de acesso à loja e domínio personalizado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="slug">Slug *</FieldLabel>
              <Input
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={handleSlugChange}
                placeholder="credito-facil"
              />
              {slug && (
                <p className="text-xs text-muted-foreground mt-1">
                  {slug}.vellofinance.com.br
                </p>
              )}
              <FieldError errors={formState.errors?.slug} />
            </Field>

            <Field>
              <FieldLabel htmlFor="custom_domain">
                Domínio Customizado
              </FieldLabel>
              <Input
                id="custom_domain"
                name="custom_domain"
                placeholder="creditos.empresa.com.br"
                defaultValue={tenant?.custom_domain ?? ''}
              />
              <FieldError errors={formState.errors?.custom_domain} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 3 — Identidade Visual */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Palette className="size-5 text-muted-foreground" />
            <CardTitle>Identidade Visual</CardTitle>
          </div>
          <CardDescription>
            Cores e arquivos visuais usados nas telas públicas do Console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field>
              <FieldLabel htmlFor="company_display_name">
                Nome de Exibição
              </FieldLabel>
              <Input
                id="company_display_name"
                name="company_display_name"
                placeholder="Nome exibido nas telas públicas"
                defaultValue={branding?.company_display_name ?? ''}
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="base_color">Base Color</FieldLabel>
              <ColorSwatchPicker
                name="base_color"
                defaultValue={branding?.base_color ?? ''}
                options={BASE_COLOR_OPTIONS}
                className="mt-1"
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel htmlFor="theme_color">Theme Color</FieldLabel>
              <ColorSwatchPicker
                name="theme_color"
                defaultValue={branding?.theme_color ?? ''}
                options={THEME_COLOR_OPTIONS}
                className="mt-1"
              />
            </Field>

            <Field>
              <FieldLabel>Logo</FieldLabel>
              <ImageUpload
                name="logo"
                accept="image/png,image/svg+xml,image/webp"
                maxSize={2 * 1024 * 1024}
                variant="landscape"
                imageContainerClassName="w-full max-w-[350px] h-[100px] !aspect-auto"
                hint="PNG, SVG ou WebP. Máx 2MB."
                currentUrl={branding?.logo_url}
              />
            </Field>

            <Field>
              <FieldLabel>Favicon</FieldLabel>
              <ImageUpload
                name="favicon"
                accept="image/png,image/x-icon"
                maxSize={512 * 1024}
                variant="square"
                imageContainerClassName="w-[100px]"
                hint="PNG ou ICO. Máx 512KB."
                currentUrl={branding?.favicon_url}
              />
            </Field>

            <Field className="md:col-span-2">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <FieldLabel htmlFor="use_custom_theme" className="text-base">
                    Tema White-Label
                  </FieldLabel>
                  <p className="text-sm text-muted-foreground">
                    Ativa personalização avançada de tokens CSS por tenant.
                  </p>
                </div>
                <Switch
                  id="use_custom_theme"
                  name="use_custom_theme"
                  checked={isWhiteLabel}
                  onCheckedChange={setIsWhiteLabel}
                />
              </div>
            </Field>

            {isWhiteLabel && (
              <>
                <Field className="md:col-span-2">
                  <FieldLabel htmlFor="custom_css">CSS Customizado</FieldLabel>
                  <textarea
                    id="custom_css"
                    name="custom_css"
                    rows={8}
                    defaultValue={customCssDefault}
                    placeholder={`[data-tenant-theme="meu-tenant"] .hero-panel {\n  background: linear-gradient(135deg, #4b281e, #190c0a);\n}`}
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    CSS avançado aplicado depois do tema gerado. Use o seletor{' '}
                    <code className="font-mono">
                      [data-tenant-theme=&quot;slug&quot;]
                    </code>{' '}
                    para escopo.
                  </p>
                </Field>

                <Field className="md:col-span-2">
                  <FieldLabel>Imagem de Fundo Auth</FieldLabel>
                  <ImageUpload
                    name="auth_bg"
                    accept="image/jpeg,image/png,image/webp"
                    maxSize={5 * 1024 * 1024}
                    variant="landscape"
                    hint="JPG, PNG ou WebP. Máx 5MB."
                    currentUrl={branding?.auth_bg_image_url}
                  />
                </Field>
              </>
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 4 — Dados Bancários */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <CreditCard className="size-5 text-muted-foreground" />
            <CardTitle>Dados Bancários</CardTitle>
          </div>
          <CardDescription>
            Informações para repasse de comissões. Todos os campos são
            opcionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="bank_name">Banco</FieldLabel>
              <Input
                id="bank_name"
                name="bank_name"
                placeholder="Ex: Itaú"
                defaultValue={tenant?.bank_name ?? ''}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="bank_pix_key">Chave PIX</FieldLabel>
              <Input
                id="bank_pix_key"
                name="bank_pix_key"
                placeholder="CPF, CNPJ, e-mail ou chave aleatória"
                defaultValue={tenant?.bank_pix_key ?? ''}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="bank_agency">Agência</FieldLabel>
              <Input
                id="bank_agency"
                name="bank_agency"
                placeholder="0001"
                defaultValue={tenant?.bank_agency ?? ''}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="bank_account">Conta</FieldLabel>
              <Input
                id="bank_account"
                name="bank_account"
                placeholder="00000-0"
                defaultValue={tenant?.bank_account ?? ''}
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/tenants')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEdit ? (
            'Salvar Alterações'
          ) : (
            'Cadastrar Parceiro'
          )}
        </Button>
      </div>
    </form>
  )
}

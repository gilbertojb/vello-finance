'use client'

import { Building2, CreditCard, Loader2, Palette, Store } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { ImageUpload } from '@/components/ui/image-upload'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useFormState } from '@/hooks/use-form-state'

import { createTenant } from '../actions'

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function TenantForm() {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const slugManuallyEdited = useRef(false)
  const [isWhiteLabel, setIsWhiteLabel] = useState(false)

  const [formState, handleSubmit, isPending] = useFormState(
    createTenant,
    () => {
      toast.success('Parceiro cadastrado com sucesso!')
      router.push('/tenants')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugManuallyEdited.current) {
      setSlug(slugify(e.target.value))
    }
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    slugManuallyEdited.current = true
    setSlug(e.target.value)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {/* Card 1 — Dados da Empresa */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Building2 className="size-5 text-muted-foreground" />
            <CardTitle>Dados da Empresa</CardTitle>
          </div>
          <CardDescription>
            Informações principais do parceiro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="name">Nome Fantasia *</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: Crédito Fácil"
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
              />
              <FieldError errors={formState.errors?.company_name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
              <Input
                id="cnpj"
                name="cnpj"
                placeholder="00.000.000/0000-00"
              />
              <FieldError errors={formState.errors?.cnpj} />
            </Field>

            <Field>
              <FieldLabel htmlFor="email">E-mail de Contato *</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="contato@empresa.com.br"
              />
              <FieldError errors={formState.errors?.email} />
            </Field>

            <Field>
              <FieldLabel htmlFor="phone">Telefone</FieldLabel>
              <Input
                id="phone"
                name="phone"
                placeholder="(11) 99999-9999"
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
              <FieldLabel htmlFor="custom_domain">Domínio Customizado</FieldLabel>
              <Input
                id="custom_domain"
                name="custom_domain"
                placeholder="creditos.empresa.com.br"
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
              <FieldLabel htmlFor="company_display_name">Nome de Exibição</FieldLabel>
              <Input
                id="company_display_name"
                name="company_display_name"
                placeholder="Nome exibido nas telas públicas"
              />
            </Field>

            {/* Base Color */}
            <Field>
              <FieldLabel htmlFor="base_color">Base Color</FieldLabel>
              <select
                id="base_color"
                name="base_color"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Padrão do sistema</option>
                <option value="Neutral">Neutral</option>
                <option value="Stone">Stone</option>
                <option value="Zinc">Zinc</option>
                <option value="Mauve">Mauve</option>
                <option value="Olive">Olive</option>
                <option value="Mist">Mist</option>
                <option value="Taupe">Taupe</option>
              </select>
            </Field>

            {/* Theme Color */}
            <Field>
              <FieldLabel htmlFor="theme_color">Theme Color</FieldLabel>
              <select
                id="theme_color"
                name="theme_color"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Padrão do sistema</option>
                <option value="red">Red</option>
                <option value="orange">Orange</option>
                <option value="amber">Amber</option>
                <option value="yellow">Yellow</option>
                <option value="lime">Lime</option>
                <option value="green">Green</option>
                <option value="emerald">Emerald</option>
                <option value="teal">Teal</option>
                <option value="cyan">Cyan</option>
                <option value="sky">Sky</option>
                <option value="blue">Blue</option>
                <option value="indigo">Indigo</option>
                <option value="violet">Violet</option>
                <option value="purple">Purple</option>
                <option value="fuchsia">Fuchsia</option>
                <option value="pink">Pink</option>
                <option value="rose">Rose</option>
              </select>
            </Field>

            {/* Toggle: CSS customizado white-label */}
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

            {/* Custom CSS — visível apenas para tenants white-label */}
            {isWhiteLabel && (
              <Field className="md:col-span-2">
                <FieldLabel htmlFor="custom_css">CSS Customizado</FieldLabel>
                <textarea
                  id="custom_css"
                  name="custom_css"
                  rows={8}
                  placeholder={`[data-tenant-theme="meu-tenant"] .hero-panel {\n  background: linear-gradient(135deg, #4b281e, #190c0a);\n}`}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  CSS avançado aplicado depois do tema gerado. Use o seletor{' '}
                  <code className="font-mono">[data-tenant-theme=&quot;slug&quot;]</code> para escopo.
                </p>
              </Field>
            )}

            <Field>
              <FieldLabel>Logo</FieldLabel>
              <ImageUpload
                name="logo"
                accept="image/png,image/svg+xml,image/webp"
                maxSize={2 * 1024 * 1024}
                variant="square"
                hint="PNG, SVG ou WebP. Máx 2MB."
              />
            </Field>

            <Field>
              <FieldLabel>Favicon</FieldLabel>
              <ImageUpload
                name="favicon"
                accept="image/png,image/x-icon"
                maxSize={512 * 1024}
                variant="square"
                hint="PNG ou ICO. Máx 512KB."
              />
            </Field>

            <Field className="md:col-span-2">
              <FieldLabel>Imagem de Fundo Auth</FieldLabel>
              <ImageUpload
                name="auth_bg"
                accept="image/jpeg,image/png,image/webp"
                maxSize={5 * 1024 * 1024}
                variant="landscape"
                hint="JPG, PNG ou WebP. Máx 5MB."
              />
            </Field>
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
            Informações para repasse de comissões. Todos os campos são opcionais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="bank_name">Banco</FieldLabel>
              <Input id="bank_name" name="bank_name" placeholder="Ex: Itaú" />
            </Field>

            <Field>
              <FieldLabel htmlFor="bank_pix_key">Chave PIX</FieldLabel>
              <Input id="bank_pix_key" name="bank_pix_key" placeholder="CPF, CNPJ, e-mail ou chave aleatória" />
            </Field>

            <Field>
              <FieldLabel htmlFor="bank_agency">Agência</FieldLabel>
              <Input id="bank_agency" name="bank_agency" placeholder="0001" />
            </Field>

            <Field>
              <FieldLabel htmlFor="bank_account">Conta</FieldLabel>
              <Input id="bank_account" name="bank_account" placeholder="00000-0" />
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
          {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Cadastrar Parceiro'}
        </Button>
      </div>
    </form>
  )
}

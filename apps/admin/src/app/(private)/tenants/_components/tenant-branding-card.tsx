import { Palette } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ColorSwatchPicker } from '@/components/ui/color-swatch-picker'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { ImageUpload } from '@/components/ui/image-upload'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'

import { BASE_COLOR_OPTIONS, THEME_COLOR_OPTIONS } from './tenant-form-types'

type BrandingDefaults = {
  company_display_name: string | null
  base_color: string | null
  theme_color: string | null
  custom_css: string | null
  logo_url: string | null
  favicon_url: string | null
  auth_bg_image_url: string | null
}

type Props = {
  branding: BrandingDefaults | null
  isWhiteLabel: boolean
  onWhiteLabelChange: (checked: boolean) => void
}

export function TenantBrandingCard({
  branding,
  isWhiteLabel,
  onWhiteLabelChange,
}: Props) {
  return (
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
                onCheckedChange={onWhiteLabelChange}
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
                  defaultValue={branding?.custom_css ?? ''}
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
  )
}

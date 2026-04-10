'use client'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'

import type { BrandingSettings } from '../queries'
import { updateStoreSettings } from '../actions'

const BASE_COLORS = ['Neutral', 'Stone', 'Zinc', 'Mauve', 'Olive', 'Mist', 'Taupe']
const THEME_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo',
  'violet', 'purple', 'fuchsia', 'pink', 'rose',
]

interface StoreSettingsFormProps {
  defaultValues: BrandingSettings
}

export function StoreSettingsForm({ defaultValues }: StoreSettingsFormProps) {
  const [, handleSubmit, isPending] = useFormState(
    updateStoreSettings,
    () => { toast.success('Configurações salvas!') },
    (msg) => { toast.error(msg) },
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="base_color">Cor base</FieldLabel>
          <select
            id="base_color"
            name="base_color"
            defaultValue={defaultValues?.base_color ?? 'Neutral'}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {BASE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="theme_color">Cor de destaque</FieldLabel>
          <select
            id="theme_color"
            name="theme_color"
            defaultValue={defaultValues?.theme_color ?? 'blue'}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {THEME_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="logo">Logo</FieldLabel>
          {defaultValues?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaultValues.logo_url}
              alt="Logo atual"
              className="mb-2 h-8 w-auto rounded"
            />
          )}
          <Input
            id="logo"
            type="file"
            name="logo"
            accept="image/png,image/svg+xml,image/webp"
          />
          <p className="text-muted-foreground text-xs">PNG, SVG ou WebP. Máx 2MB.</p>
        </Field>

        <Field>
          <FieldLabel htmlFor="favicon">Favicon</FieldLabel>
          {defaultValues?.favicon_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaultValues.favicon_url}
              alt="Favicon atual"
              className="mb-2 h-4 w-4"
            />
          )}
          <Input
            id="favicon"
            type="file"
            name="favicon"
            accept="image/png,image/x-icon"
          />
          <p className="text-muted-foreground text-xs">PNG ou ICO. Máx 512KB.</p>
        </Field>

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Salvar configurações'
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}

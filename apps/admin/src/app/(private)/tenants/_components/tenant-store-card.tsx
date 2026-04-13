import { Store } from 'lucide-react'

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
import { Input } from '@/components/ui/input'

import type { FormErrors } from './tenant-form-types'

type Props = {
  slug: string
  onSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  defaultCustomDomain: string
  errors: FormErrors
}

export function TenantStoreCard({
  slug,
  onSlugChange,
  defaultCustomDomain,
  errors,
}: Props) {
  return (
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
              onChange={onSlugChange}
              placeholder="credito-facil"
            />
            {slug && (
              <p className="text-xs text-muted-foreground mt-1">
                {slug}.vellofinance.com.br
              </p>
            )}
            <FieldError errors={errors?.slug} />
          </Field>

          <Field>
            <FieldLabel htmlFor="custom_domain">
              Domínio Customizado
            </FieldLabel>
            <Input
              id="custom_domain"
              name="custom_domain"
              placeholder="creditos.empresa.com.br"
              defaultValue={defaultCustomDomain}
            />
            <FieldError errors={errors?.custom_domain} />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

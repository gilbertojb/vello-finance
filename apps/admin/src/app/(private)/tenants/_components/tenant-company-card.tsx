import { Building2, Loader2 } from 'lucide-react'

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
import { PhoneInput } from '@/components/ui/masked-input'

import type { FormErrors } from './tenant-form-types'

type Props = {
  cnpj: string
  onCnpjChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCnpjBlur: () => void
  isFetchingCnpj: boolean
  cnpjLookupError: string | null
  name: string
  onNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  companyName: string
  onCompanyNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  email: string
  onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  contactName: string
  onContactNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  phone: string
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  errors: FormErrors
}

export function TenantCompanyCard({
  cnpj,
  onCnpjChange,
  onCnpjBlur,
  isFetchingCnpj,
  cnpjLookupError,
  name,
  onNameChange,
  companyName,
  onCompanyNameChange,
  email,
  onEmailChange,
  contactName,
  onContactNameChange,
  phone,
  onPhoneChange,
  errors,
}: Props) {
  return (
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
                onChange={onCnpjChange}
                onBlur={onCnpjBlur}
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
            <FieldError errors={errors?.cnpj} />
          </Field>

          <Field>
            <FieldLabel htmlFor="name">Nome Fantasia *</FieldLabel>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex: Crédito Fácil"
              value={name}
              onChange={onNameChange}
            />
            <FieldError errors={errors?.name} />
          </Field>

          <Field>
            <FieldLabel htmlFor="company_name">Razão Social</FieldLabel>
            <Input
              id="company_name"
              name="company_name"
              placeholder="Ex: Crédito Fácil Ltda"
              value={companyName}
              onChange={onCompanyNameChange}
            />
            <FieldError errors={errors?.company_name} />
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
              onChange={onEmailChange}
            />
            <FieldError errors={errors?.email} />
          </Field>

          <Field>
            <FieldLabel htmlFor="contact_name">Nome do Contato *</FieldLabel>
            <Input
              id="contact_name"
              name="contact_name"
              required
              placeholder="Nome da pessoa de contato"
              value={contactName}
              onChange={onContactNameChange}
            />
            <FieldError errors={errors?.contact_name} />
          </Field>

          <Field>
            <FieldLabel htmlFor="phone">Telefone</FieldLabel>
            <PhoneInput
              id="phone"
              name="phone"
              value={phone}
              onChange={onPhoneChange}
            />
            <FieldError errors={errors?.phone} />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

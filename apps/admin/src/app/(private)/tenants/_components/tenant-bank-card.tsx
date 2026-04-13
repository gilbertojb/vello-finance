import { CreditCard } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type Props = {
  defaultBankName: string
  defaultBankPixKey: string
  defaultBankAgency: string
  defaultBankAccount: string
}

export function TenantBankCard({
  defaultBankName,
  defaultBankPixKey,
  defaultBankAgency,
  defaultBankAccount,
}: Props) {
  return (
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
              defaultValue={defaultBankName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="bank_pix_key">Chave PIX</FieldLabel>
            <Input
              id="bank_pix_key"
              name="bank_pix_key"
              placeholder="CPF, CNPJ, e-mail ou chave aleatória"
              defaultValue={defaultBankPixKey}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="bank_agency">Agência</FieldLabel>
            <Input
              id="bank_agency"
              name="bank_agency"
              placeholder="0001"
              defaultValue={defaultBankAgency}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="bank_account">Conta</FieldLabel>
            <Input
              id="bank_account"
              name="bank_account"
              placeholder="00000-0"
              defaultValue={defaultBankAccount}
            />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

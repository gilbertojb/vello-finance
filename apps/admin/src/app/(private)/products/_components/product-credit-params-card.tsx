import { Banknote, Calendar, TrendingUp } from 'lucide-react'

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
import { MoneyInput, PercentInput } from '@/components/ui/masked-input'

import type { FormErrors, ProductWithPartners } from './product-form-types'

type Props = {
  product?: ProductWithPartners
  errors: FormErrors
}

export function ProductCreditParamsCard({ product, errors }: Props) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Parâmetros de Crédito</CardTitle>
        <CardDescription>
          Limites operacionais e precificação padrão do produto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="flex items-center gap-2 uppercase text-sm font-medium text-primary/50">
              <Banknote className="size-4" />
              Limites de Valores
            </h2>
            <Field>
              <FieldLabel htmlFor="min_amount">Valor Mínimo</FieldLabel>
              <MoneyInput
                id="min_amount"
                name="min_amount"
                defaultValue={product?.min_amount ?? ''}
              />
              <FieldError errors={errors?.min_amount} />
            </Field>
            <Field>
              <FieldLabel htmlFor="max_amount">Valor Máximo</FieldLabel>
              <MoneyInput
                id="max_amount"
                name="max_amount"
                defaultValue={product?.max_amount ?? ''}
              />
              <FieldError errors={errors?.max_amount} />
            </Field>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="flex items-center gap-2 uppercase text-sm font-medium text-primary/50">
              <Calendar className="size-4" />
              Prazos em Meses
            </h2>
            <Field>
              <FieldLabel htmlFor="min_term_months">
                Prazo Mínimo (meses)
              </FieldLabel>
              <Input
                id="min_term_months"
                name="min_term_months"
                type="number"
                step="1"
                placeholder="1"
                defaultValue={product?.min_term_months ?? ''}
              />
              <FieldError errors={errors?.min_term_months} />
            </Field>
            <Field>
              <FieldLabel htmlFor="max_term_months">
                Prazo Máximo (meses)
              </FieldLabel>
              <Input
                id="max_term_months"
                name="max_term_months"
                type="number"
                step="1"
                placeholder="120"
                defaultValue={product?.max_term_months ?? ''}
              />
              <FieldError errors={errors?.max_term_months} />
            </Field>
          </div>

          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <h2 className="flex items-center gap-2 uppercase text-sm font-medium text-primary/50">
              <TrendingUp className="size-4" />
              Taxas de Juros (% A.M.)
            </h2>
            <Field>
              <FieldLabel htmlFor="min_rate_monthly">
                Taxa Mínima (% a.m.)
              </FieldLabel>
              <PercentInput
                id="min_rate_monthly"
                name="min_rate_monthly"
                defaultValue={product?.min_rate_monthly ?? ''}
              />
              <FieldError errors={errors?.min_rate_monthly} />
            </Field>
            <Field>
              <FieldLabel htmlFor="max_rate_monthly">
                Taxa Máxima (% a.m.)
              </FieldLabel>
              <PercentInput
                id="max_rate_monthly"
                name="max_rate_monthly"
                defaultValue={product?.max_rate_monthly ?? ''}
              />
              <FieldError errors={errors?.max_rate_monthly} />
            </Field>
          </div>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

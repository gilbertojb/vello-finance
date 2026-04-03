'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { toast } from 'sonner'

import { CommissionCascade } from '@/components/commissions/commission-cascade'

import { Button } from '@/components/ui/button'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useFormState } from '@/hooks/use-form-state'

import { createProduct } from '../actions'

type Partner = { id: string; name: string }

export function ProductForm({ partners }: { partners: Partner[] }) {
  const router = useRouter()

  const [bankPct, setBankPct] = useState<number>(0)
  const [velloPct, setVelloPct] = useState<number>(0)

  const [formState, handleSubmit, isPending] = useFormState(
    createProduct,
    () => {
      toast.success('Produto criado com sucesso!')
      router.push('/products')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-medium text-foreground">Identificação</h2>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="name">Nome do Produto *</FieldLabel>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex: Consignado INSS"
            />
            <FieldError errors={formState.errors?.name} />
          </Field>

          <Field>
            <FieldLabel htmlFor="type">Tipo *</FieldLabel>
            <select
              id="type"
              name="type"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="">Selecione...</option>
              <option value="fgts">FGTS</option>
              <option value="consignado_publico">Consignado Público</option>
              <option value="consignado_privado">Consignado Privado</option>
              <option value="home_equity">Home Equity</option>
              <option value="auto_equity">Auto Equity</option>
              <option value="outros">Outros</option>
            </select>
            <FieldError errors={formState.errors?.type} />
          </Field>

          <Field className="col-span-full">
            <FieldLabel htmlFor="description">Descrição</FieldLabel>
            <Input
              id="description"
              name="description"
              placeholder="Ex: Antecipação do saque-aniversário"
            />
            <FieldError errors={formState.errors?.description} />
          </Field>

          <Field>
            <FieldLabel htmlFor="financial_partner_id">
              Parceiro Bancário
            </FieldLabel>
            <select
              id="financial_partner_id"
              name="financial_partner_id"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Nenhum (Produto Próprio / Outro)</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <FieldError errors={formState.errors?.financial_partner_id} />
          </Field>

          <Field className="col-span-full mt-4 flex flex-row items-center space-x-2 space-y-0">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              defaultChecked
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <FieldLabel htmlFor="is_active" className="cursor-pointer">
              Produto Ativo
            </FieldLabel>
            <FieldError errors={formState.errors?.is_active} />
          </Field>
        </FieldGroup>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-medium text-foreground">
          Parâmetros de Crédito
        </h2>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="min_amount">Valor Mínimo (R$)</FieldLabel>
            <Input
              id="min_amount"
              name="min_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
            <FieldError errors={formState.errors?.min_amount} />
          </Field>

          <Field>
            <FieldLabel htmlFor="max_amount">Valor Máximo (R$)</FieldLabel>
            <Input
              id="max_amount"
              name="max_amount"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
            <FieldError errors={formState.errors?.max_amount} />
          </Field>

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
            />
            <FieldError errors={formState.errors?.min_term_months} />
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
            />
            <FieldError errors={formState.errors?.max_term_months} />
          </Field>

          <Field>
            <FieldLabel htmlFor="min_rate_monthly">
              Taxa Mínima ao Mês (%)
            </FieldLabel>
            <Input
              id="min_rate_monthly"
              name="min_rate_monthly"
              type="number"
              step="0.01"
              placeholder="1.00"
            />
            <FieldError errors={formState.errors?.min_rate_monthly} />
          </Field>

          <Field>
            <FieldLabel htmlFor="max_rate_monthly">
              Taxa Máxima ao Mês (%)
            </FieldLabel>
            <Input
              id="max_rate_monthly"
              name="max_rate_monthly"
              type="number"
              step="0.01"
              placeholder="5.00"
            />
            <FieldError errors={formState.errors?.max_rate_monthly} />
          </Field>
        </FieldGroup>
      </div>

      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        <h2 className="text-lg font-medium text-foreground">Comissionamento</h2>
        <p className="text-sm text-muted-foreground">
          Configure as taxas base cobradas pelo banco e a retenção
          administrativa da Vello.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Field>
              <FieldLabel htmlFor="bank_commission_pct">
                Comissão do Banco (%) *
              </FieldLabel>
              <FieldDescription>
                Percentual total de comissão pago pelo banco à Vello
              </FieldDescription>
              <Input
                id="bank_commission_pct"
                name="bank_commission_pct"
                type="number"
                step="0.01"
                min="0.01"
                max="100"
                required
                placeholder="Ex: 10.00"
                value={bankPct || ''}
                onChange={(e) => setBankPct(parseFloat(e.target.value) || 0)}
              />
              <FieldError errors={formState.errors?.bank_commission_pct} />
            </Field>

            <Field>
              <FieldLabel htmlFor="vello_commission_pct">
                Retenção Vello (%) *
              </FieldLabel>
              <FieldDescription>
                Parte da comissão que a Vello retém como receita
              </FieldDescription>
              <Input
                id="vello_commission_pct"
                name="vello_commission_pct"
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="Ex: 5.00"
                value={velloPct || ''}
                onChange={(e) => setVelloPct(parseFloat(e.target.value) || 0)}
              />
              <FieldError errors={formState.errors?.vello_commission_pct} />
            </Field>
          </div>

          <div>
            <CommissionCascade bankPct={bankPct} velloPct={velloPct} />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/products')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Salvando...' : 'Salvar Produto'}
        </Button>
      </div>
    </form>
  )
}

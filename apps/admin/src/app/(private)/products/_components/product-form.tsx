'use client'

import { AlertTriangle, Banknote, Calendar, Info, Loader2, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
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
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor'
import { useFormState } from '@/hooks/use-form-state'

import { createProduct, updateProduct } from '../actions'
import { PartnerItem } from './partner-item'

type Partner = { id: string; name: string }

export type ProductWithPartners = {
  id: string
  name: string
  type: string
  description: string | null
  internal_description: string | null
  min_amount: number | null
  max_amount: number | null
  min_term_months: number | null
  max_term_months: number | null
  min_rate_monthly: number | null
  max_rate_monthly: number | null
  is_active: boolean
  product_financial_partners: Array<{
    financial_partner_id: string
    if_commission_pct: number
    vello_commission_pct: number
  }>
}

type Props = {
  partners: Partner[]
  product?: ProductWithPartners
}

export function ProductForm({ partners, product }: Props) {
  const router = useRouter()
  const isEdit = !!product

  const linkedPartnerIds = new Set(
    product?.product_financial_partners.map((p) => p.financial_partner_id) ?? [],
  )

  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(
    linkedPartnerIds,
  )

  const action = isEdit ? updateProduct : createProduct

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(isEdit ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!')
      router.push('/products')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  function togglePartner(id: string) {
    setSelectedPartners((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={product.id} />}

      {isEdit && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Alterações nos percentuais não afetam propostas já criadas
            (snapshots imutáveis).
          </span>
        </div>
      )}

      {/* Card 1 — Identificação */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Identificação</CardTitle>
          <CardDescription>
            Defina as informações básicas e a visibilidade do produto na
            plataforma.
          </CardDescription>
          <CardAction className="my-auto">
            <div className="flex items-center space-x-2">
              <FieldLabel htmlFor="is_active" className="cursor-pointer">
                Produto Ativo
              </FieldLabel>
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={product?.is_active ?? true}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field className="col-span-full md:col-span-2">
              <FieldLabel htmlFor="name">Nome do Produto *</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: Consignado INSS"
                defaultValue={product?.name ?? ''}
              />
              <FieldError errors={formState.errors?.name} />
            </Field>

            <Field className="col-span-full md:col-span-2">
              <FieldLabel htmlFor="type">Tipo *</FieldLabel>
              <select
                id="type"
                name="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required={!isEdit}
                disabled={isEdit}
                defaultValue={product?.type ?? ''}
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

            <Field className="col-span-full md:col-span-2 mt-4">
              <div className="flex flex-col">
                <FieldLabel htmlFor="description">
                  Descrição Pública
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3 stroke-accent" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Informação pública exibida para clientes.</p>
                    </TooltipContent>
                  </Tooltip>
                </FieldLabel>
              </div>
              <WysiwygEditor
                id="description"
                name="description"
                placeholder="Ex: Antecipação do saque-aniversário"
                defaultValue={product?.description ?? ''}
              />
              <FieldError errors={formState.errors?.description} />
            </Field>

            <Field className="col-span-full md:col-span-2 mt-4">
              <div className="flex flex-col">
                <FieldLabel htmlFor="internal_description">
                  Descrição Interna
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3 stroke-accent" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Informação confidencial visível apenas para os
                        parceiros.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FieldLabel>
              </div>
              <WysiwygEditor
                id="internal_description"
                name="internal_description"
                placeholder="Ex: Lembre-se de validar a taxa balcão 2x antes de fechar."
                defaultValue={product?.internal_description ?? ''}
              />
              <FieldError errors={formState.errors?.internal_description} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 2 — Parâmetros de Crédito */}
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
                <FieldLabel htmlFor="min_amount">Valor Mínimo (R$)</FieldLabel>
                <Input
                  id="min_amount"
                  name="min_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  defaultValue={product?.min_amount ?? ''}
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
                  defaultValue={product?.max_amount ?? ''}
                />
                <FieldError errors={formState.errors?.max_amount} />
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
                  defaultValue={product?.max_term_months ?? ''}
                />
                <FieldError errors={formState.errors?.max_term_months} />
              </Field>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="flex items-center gap-2 uppercase text-sm font-medium text-primary/50">
                <TrendingUp className="size-4" />
                Taxas de Juros (% A.M.)
              </h2>
              <Field>
                <FieldLabel htmlFor="min_rate_monthly">
                  Taxa Mínima (%)
                </FieldLabel>
                <Input
                  id="min_rate_monthly"
                  name="min_rate_monthly"
                  type="number"
                  step="0.001"
                  placeholder="1.000"
                  defaultValue={product?.min_rate_monthly ?? ''}
                />
                <FieldError errors={formState.errors?.min_rate_monthly} />
              </Field>
              <Field>
                <FieldLabel htmlFor="max_rate_monthly">
                  Taxa Máxima (%)
                </FieldLabel>
                <Input
                  id="max_rate_monthly"
                  name="max_rate_monthly"
                  type="number"
                  step="0.001"
                  placeholder="5.000"
                  defaultValue={product?.max_rate_monthly ?? ''}
                />
                <FieldError errors={formState.errors?.max_rate_monthly} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 3 — Instituições Financeiras */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Instituições Financeiras</CardTitle>
          <CardDescription>
            Selecione as IFs que operam este produto e informe os percentuais de
            comissão negociados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhuma instituição financeira cadastrada.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {partners.map((partner) => {
                const isSelected = selectedPartners.has(partner.id)
                const linked = product?.product_financial_partners.find(
                  (p) => p.financial_partner_id === partner.id,
                )
                return (
                  <PartnerItem
                    key={partner.id}
                    partner={partner}
                    isSelected={isSelected}
                    onToggle={togglePartner}
                    defaultIfCommission={linked?.if_commission_pct}
                    defaultVelloCommission={linked?.vello_commission_pct}
                  />
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/products')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

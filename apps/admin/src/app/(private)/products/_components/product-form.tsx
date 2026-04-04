'use client'

import { Banknote, Calendar, Info, Loader2, TrendingUp } from 'lucide-react'
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

import { createProduct } from '../actions'

type Partner = { id: string; name: string }

export function ProductForm({ partners }: { partners: Partner[] }) {
  const router = useRouter()
  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set())

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
              <Switch id="is_active" name="is_active" defaultChecked />
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
              />
              <FieldError errors={formState.errors?.name} />
            </Field>

            <Field className="col-span-full md:col-span-2">
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
            Selecione as IFs que operam este produto e informe os percentuais
            de comissão negociados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhuma instituição financeira cadastrada.
            </p>
          ) : (
            <div className="space-y-4">
              {partners.map((partner) => {
                const isSelected = selectedPartners.has(partner.id)
                return (
                  <div key={partner.id} className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="partner_ids"
                        value={partner.id}
                        checked={isSelected}
                        onChange={() => togglePartner(partner.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">{partner.name}</span>
                    </label>

                    {isSelected && (
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor={`if_commission_${partner.id}`}>
                            IF paga à Vello (%)
                          </FieldLabel>
                          <Input
                            id={`if_commission_${partner.id}`}
                            name={`if_commission_${partner.id}`}
                            type="number"
                            step="0.001"
                            min="0.001"
                            max="100"
                            required
                            placeholder="Ex: 10.000"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`vello_commission_${partner.id}`}>
                            Retenção Vello (%)
                          </FieldLabel>
                          <Input
                            id={`vello_commission_${partner.id}`}
                            name={`vello_commission_${partner.id}`}
                            type="number"
                            step="0.001"
                            min="0"
                            max="100"
                            required
                            placeholder="Ex: 5.000"
                          />
                        </Field>
                      </div>
                    )}
                  </div>
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

'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'

import type { FormErrors, Pipeline, ProductWithPartners } from './product-form-types'

type Props = {
  pipelines: Pipeline[]
  product?: ProductWithPartners
  isEdit: boolean
  errors: FormErrors
}

export function ProductPipelineCard({ pipelines, product, isEdit, errors }: Props) {
  const [selectedId, setSelectedId] = useState(product?.product_type_id ?? '')

  const selected = pipelines.find((p) => p.id === selectedId)

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Esteira</CardTitle>
        <CardDescription>
          Defina o modelo de pipeline que este produto seguirá.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="product_type_id">Modelo de Pipeline *</FieldLabel>
            {isEdit && (
              <input
                type="hidden"
                name="product_type_id"
                value={product!.product_type_id}
              />
            )}
            <select
              id="product_type_id"
              name={isEdit ? undefined : 'product_type_id'}
              disabled={isEdit}
              required={!isEdit}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <FieldError errors={errors?.product_type_id} />
          </Field>

          {selected && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Etapas ({selected.proposal_stages.length})
                </span>
                <Link
                  href={`/pipelines/${selected.id}/pipeline`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Editar esteira
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              {selected.proposal_stages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Esta esteira ainda não possui etapas configuradas.
                </p>
              ) : (
                <ol className="space-y-1">
                  {selected.proposal_stages.map((stage, i) => (
                    <li
                      key={stage.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-mono shrink-0">
                        {i + 1}
                      </span>
                      {stage.name}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

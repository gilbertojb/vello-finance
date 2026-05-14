'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useFormState } from '@/hooks/use-form-state'

import { createProduct, updateProduct } from '../actions'
import { ProductCreditParamsCard } from './product-credit-params-card'
import type { Partner, Pipeline, ProductWithPartners } from './product-form-types'
import { ProductIdentificationCard } from './product-identification-card'
import { ProductPartnersCard } from './product-partners-card'
import { ProductPipelineCard } from './product-pipeline-card'

export type { ProductWithPartners } from './product-form-types'

type Props = {
  partners: Partner[]
  pipelines: Pipeline[]
  product?: ProductWithPartners
}

export function ProductForm({ partners, pipelines, product }: Props) {
  const router = useRouter()
  const isEdit = !!product

  const linkedPartnerIds = new Set(
    product?.product_financial_partners.map((p) => p.financial_partner_id) ?? [],
  )

  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(linkedPartnerIds)

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
            Alterações nos percentuais não afetam propostas já criadas (snapshots imutáveis).
          </span>
        </div>
      )}

      <ProductIdentificationCard
        product={product}
        errors={formState.errors}
      />

      <ProductCreditParamsCard
        product={product}
        errors={formState.errors}
      />

      <ProductPartnersCard
        partners={partners}
        product={product}
        selectedPartners={selectedPartners}
        onTogglePartner={togglePartner}
      />

      <ProductPipelineCard
        pipelines={pipelines}
        product={product}
        isEdit={isEdit}
        errors={formState.errors}
      />

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

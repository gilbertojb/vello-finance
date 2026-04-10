'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import type { TenantProductRow } from '../queries'
import { toggleTenantProduct } from '../actions'

interface ProductListProps {
  products: TenantProductRow[]
}

export function ProductList({ products }: ProductListProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleTenantProduct(id, isActive)
      if (!result.success) {
        toast.error(result.message ?? 'Erro ao atualizar produto.')
      }
    })
  }

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum produto disponível. Entre em contato com a Vello Finance para ativar produtos.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {products.map((tp) => {
        const product = tp.products
        if (!product) return null

        return (
          <div
            key={tp.id}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">{product.name}</span>
              {product.description && (
                <span className="text-muted-foreground text-xs">{product.description}</span>
              )}
              <span className="text-muted-foreground text-xs">
                Sua comissão: {Number(tp.tenant_commission_pct).toFixed(4)}%
              </span>
            </div>

            <Switch
              checked={tp.is_active}
              onCheckedChange={(checked) => handleToggle(tp.id, checked)}
              disabled={isPending || !product.is_active}
              title={!product.is_active ? 'Produto indisponível' : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}

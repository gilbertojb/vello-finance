'use client'

import { Package, PlusCircle } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { addTenantProduct } from '../actions'
import type { ProductRow, TenantProductRow } from '../queries'

interface AvailableProductsProps {
  products: ProductRow[]
  tenantProducts: TenantProductRow[]
}

export function AvailableProducts({ products, tenantProducts }: AvailableProductsProps) {
  const [isPending, startTransition] = useTransition()

  const availableProducts = products.filter(
    (product) => !tenantProducts.some((tp) => tp.products?.id === product.id),
  )

  function handleAddProduct(productId: string) {
    startTransition(async () => {
      const result = await addTenantProduct(productId)
      if (!result.success) {
        toast.error(result.message ?? 'Erro ao adicionar produto.')
      } else {
        toast.success(result.message)
      }
    })
  }

  if (availableProducts.length === 0) return null

  return (
    <div className="mb-8 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-foreground">Produtos Disponíveis</h2>
        <p className="mt-0.5 text-sm text-foreground/55">
          Catálogo Vello de produtos prontos para você oferecer aos seus clientes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {availableProducts.map((product) => (
          <div
            key={product.id}
            className="flex flex-col rounded-2xl border border-dashed border-border bg-muted/30"
          >
            <div className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-base font-medium leading-tight text-foreground">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="min-h-8 text-xs text-foreground/55 line-clamp-2">
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 rounded-full bg-primary/10 p-2 text-primary opacity-50">
                  <Package className="size-4" />
                </div>
              </div>
            </div>

            <div className="mt-auto border-t border-border/40 p-4">
              <button
                type="button"
                onClick={() => handleAddProduct(product.id)}
                disabled={isPending}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-primary/20 bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/5 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <PlusCircle className="size-4" />
                Adicionar ao meu portfólio
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

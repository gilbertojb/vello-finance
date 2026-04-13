'use client'

import { Package, PlusCircle } from 'lucide-react'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { addTenantProduct } from '../actions'
import type { ProductRow, TenantProductRow } from '../queries'

interface AvailableProductsProps {
  products: ProductRow[]
  tenantProducts: TenantProductRow[]
}

export function AvailableProducts({
  products,
  tenantProducts,
}: AvailableProductsProps) {
  const [isPending, startTransition] = useTransition()

  // Filtra produtos que ainda não foram adicionados pelo tenant
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

  if (availableProducts.length === 0) {
    return null // Retorna null se não houver produtos disponíveis para adicionar
  }

  return (
    <div className="space-y-4 mb-8">
      <div>
        <h2 className="text-lg font-medium tracking-tight">
          Produtos Disponíveis
        </h2>
        <p className="text-sm text-muted-foreground">
          Catálogo Vello de produtos prontos para você oferecer aos seus
          clientes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {availableProducts.map((product) => (
          <Card
            key={product.id}
            className="flex flex-col border-dashed bg-muted/30"
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-medium text-base leading-tight">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                      {product.description}
                    </p>
                  )}
                </div>
                <div className="rounded-full bg-primary/10 p-2 text-primary shrink-0 opacity-50">
                  <Package className="size-4" />
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-4 mt-auto border-t border-border/40">
              <Button
                variant="outline"
                className="w-full gap-2 border-primary/20 bg-background hover:bg-primary/5 hover:text-primary transition-colors"
                onClick={() => handleAddProduct(product.id)}
                disabled={isPending}
              >
                <PlusCircle className="size-4" />
                Adicionar ao meu portfólio
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

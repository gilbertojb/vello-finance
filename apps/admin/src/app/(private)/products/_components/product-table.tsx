'use client'

import { Pencil } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { ProductTypeBadge } from './product-type-badge'

type PartnerRow = {
  financial_partner: { name: string } | null
}

type ProductRow = {
  id: string
  name: string
  is_active: boolean
  product_type: { id: string; name: string; slug: string } | null
  product_financial_partners: PartnerRow[]
}

export function ProductTable({
  products,
}: {
  products: ReadonlyArray<ProductRow>
}) {
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhum produto cadastrado.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/products/new">Cadastrar o primeiro produto</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border bg-card">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Nome
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Tipo
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Instituições Financeiras
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {products.map((product) => {
            const ifNames = product.product_financial_partners
              .map((pfp) => pfp.financial_partner?.name)
              .filter(Boolean)
              .join(', ')

            return (
              <tr
                key={product.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <td className="p-4 align-middle font-medium">{product.name}</td>
                <td className="p-4 align-middle">
                  <ProductTypeBadge name={product.product_type?.name ?? '-'} />
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {ifNames || '-'}
                </td>
                <td className="p-4 align-middle">
                  {product.is_active ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                      Inativo
                    </Badge>
                  )}
                </td>
                <td className="p-4 align-middle text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/products/${product.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

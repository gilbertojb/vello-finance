'use client'

import { GitBranch, Pencil } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

type ProductTypeRow = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
}

export function ProductTypeTable({
  productTypes,
}: {
  productTypes: ReadonlyArray<ProductTypeRow>
}) {
  if (!productTypes || productTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhum tipo de produto cadastrado.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/product-types/new">Cadastrar o primeiro tipo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border bg-card">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Nome
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Slug
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Descrição
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
          {productTypes.map((pt) => (
            <tr key={pt.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="p-4 align-middle font-medium">{pt.name}</td>
              <td className="p-4 align-middle text-muted-foreground text-xs font-mono">
                {pt.slug}
              </td>
              <td className="p-4 align-middle text-muted-foreground">
                {pt.description || '-'}
              </td>
              <td className="p-4 align-middle">
                {pt.is_active ? (
                  <span className="text-2xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Ativo
                  </span>
                ) : (
                  <span className="text-2xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    Inativo
                  </span>
                )}
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/product-types/${pt.id}/pipeline`}>
                      <GitBranch className="size-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/product-types/${pt.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

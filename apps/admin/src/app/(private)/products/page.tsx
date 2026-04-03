import Link from 'next/link'
import { Button } from '@/components/ui/button'

import { ProductTable } from './_components/product-table'
import { listProducts } from './queries'

export const metadata = {
  title: 'Produtos de Crédito',
}

export default async function ProductsPage() {
  const products = await listProducts()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Produtos de Crédito
        </h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/products/new">Cadastrar Produto</Link>
          </Button>
        </div>
      </div>
      <ProductTable products={products} />
    </div>
  )
}

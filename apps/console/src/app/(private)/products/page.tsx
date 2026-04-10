import type { Metadata } from 'next'
import { ProductList } from './_components/product-list'
import { listTenantProducts } from './queries'

export const metadata: Metadata = { title: 'Produtos' }

export default async function ProductsPage() {
  const products = await listTenantProducts()

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ative ou desative os produtos disponíveis para sua loja.
        </p>
      </div>

      <ProductList products={products} />
    </div>
  )
}

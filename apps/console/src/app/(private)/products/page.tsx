import type { Metadata } from 'next'

import { AvailableProducts } from './_components/available-products'
import { ProductList } from './_components/product-list'

import { listActiveProducts, listTenantProducts } from './queries'

export const metadata: Metadata = { title: 'Produtos' }

export default async function ProductsPage() {
  const [tenantProducts, activeProducts] = await Promise.all([
    listTenantProducts(),
    listActiveProducts(),
  ])

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ative ou desative os produtos disponíveis para sua loja.
        </p>
      </div>

      <AvailableProducts
        products={activeProducts}
        tenantProducts={tenantProducts}
      />

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-medium tracking-tight">Meus Produtos</h2>
          <p className="text-sm text-muted-foreground">
            Gerencie itens adicionados ao seu portfólio.
          </p>
        </div>
        <ProductList products={tenantProducts} />
      </div>
    </div>
  )
}

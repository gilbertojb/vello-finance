import type { Metadata } from 'next'

import { ProductPageTabs } from './_components/product-page-tabs'
import { listActiveProducts, listTenantProducts } from './queries'

export const metadata: Metadata = { title: 'Produtos' }

export default async function ProductsPage() {
  const [tenantProducts, activeProducts] = await Promise.all([
    listTenantProducts(),
    listActiveProducts(),
  ])

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      {/* Page header */}
      <div className="mb-7">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Loja · Portfólio
        </span>
        <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
          Produtos<span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
          Ative os produtos disponíveis no catálogo Vello e gerencie o portfólio da sua loja.
        </p>
      </div>

      <ProductPageTabs
        tenantProducts={tenantProducts}
        availableProducts={activeProducts}
      />
    </div>
  )
}

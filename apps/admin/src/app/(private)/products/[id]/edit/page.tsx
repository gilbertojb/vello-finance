import { notFound } from 'next/navigation'

import { ProductForm } from '../../_components/product-form'
import { getProduct, listFinancialPartners } from '../../queries'

export const metadata = {
  title: 'Editar Produto',
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [product, partners] = await Promise.all([
    getProduct(id).catch(() => null),
    listFinancialPartners(),
  ])

  if (!product) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Produto</h2>
          <p className="text-muted-foreground mt-2">{product.name}</p>
        </div>
      </div>

      <div className="pt-4">
        <ProductForm product={product} partners={partners} />
      </div>
    </div>
  )
}

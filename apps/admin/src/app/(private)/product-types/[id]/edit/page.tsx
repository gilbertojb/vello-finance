import { notFound } from 'next/navigation'

import { ProductTypeForm } from '../../_components/product-type-form'
import { getProductType } from '../../queries'

export const metadata = {
  title: 'Editar Tipo de Produto',
}

export default async function EditProductTypePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const productType = await getProductType(id).catch(() => null)

  if (!productType) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Editar Tipo de Produto
          </h2>
          <p className="text-muted-foreground mt-2">{productType.name}</p>
        </div>
      </div>
      <div className="pt-4">
        <ProductTypeForm productType={productType} />
      </div>
    </div>
  )
}

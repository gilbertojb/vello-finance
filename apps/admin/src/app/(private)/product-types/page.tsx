import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { ProductTypeTable } from './_components/product-type-table'
import { listProductTypes } from './queries'

export const metadata = {
  title: 'Tipos de Produto',
}

export default async function ProductTypesPage() {
  const productTypes = await listProductTypes()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tipos de Produto</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/product-types/new">Cadastrar Tipo</Link>
          </Button>
        </div>
      </div>
      <ProductTypeTable productTypes={productTypes} />
    </div>
  )
}

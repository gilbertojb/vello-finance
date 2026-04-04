import { ProductForm } from '../_components/product-form'
import { listFinancialPartners } from '../queries'

export const metadata = {
  title: 'Cadastrar Produto',
}

export default async function NewProductPage() {
  const partners = await listFinancialPartners()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Cadastrar Produto
          </h2>
          <p className="text-muted-foreground mt-2">
            Adicione um novo produto de crédito definindo suas taxas e as
            instituições financeiras que o operam.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <ProductForm partners={partners} />
      </div>
    </div>
  )
}

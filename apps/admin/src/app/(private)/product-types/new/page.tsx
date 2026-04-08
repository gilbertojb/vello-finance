import { ProductTypeForm } from '../_components/product-type-form'

export const metadata = {
  title: 'Cadastrar Tipo de Produto',
}

export default function NewProductTypePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Cadastrar Tipo de Produto
          </h2>
          <p className="text-muted-foreground mt-2">
            Defina um novo tipo de produto disponível na plataforma.
          </p>
        </div>
      </div>
      <div className="pt-4">
        <ProductTypeForm />
      </div>
    </div>
  )
}

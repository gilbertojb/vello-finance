import { PipelineForm } from '../_components/product-type-form'

export const metadata = { title: 'Cadastrar Esteira' }

export default async function NewPipelinePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cadastrar Esteira</h2>
          <p className="text-muted-foreground mt-2">
            Defina o nome e slug da esteira. Configure as etapas após criar.
          </p>
        </div>
      </div>
      <div className="pt-4">
        <PipelineForm />
      </div>
    </div>
  )
}

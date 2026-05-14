import { notFound } from 'next/navigation'
import { PipelineForm } from '../../_components/product-type-form'
import { getPipeline } from '../../queries'

export const metadata = { title: 'Editar Esteira' }

export default async function EditPipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pipeline = await getPipeline(id).catch(() => null)
  if (!pipeline) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Esteira</h2>
          <p className="text-muted-foreground mt-2">{pipeline.name}</p>
        </div>
      </div>
      <div className="pt-4">
        <PipelineForm productType={pipeline} />
      </div>
    </div>
  )
}

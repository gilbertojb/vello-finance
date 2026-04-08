import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'

import { getProductType, listProductTypes } from '../../queries'
import { getProductTypePipeline } from './pipeline-queries'
import { PipelineEditor } from './_components/pipeline-editor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const productType = await getProductType(id).catch(() => null)
  return { title: productType ? `Pipeline — ${productType.name}` : 'Pipeline' }
}

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [productType, stages, allProductTypes] = await Promise.all([
    getProductType(id).catch(() => null),
    getProductTypePipeline(id),
    listProductTypes(true),
  ])

  if (!productType) notFound()

  const otherProductTypes = allProductTypes.filter((pt: { id: string; name: string; slug: string }) => pt.id !== id)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/product-types" className="hover:underline">
              Tipos de Produto
            </Link>
            <span>/</span>
            <span>{productType.name}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Etapas da Esteira</h2>
          <p className="text-muted-foreground mt-1">
            Configure as etapas do pipeline de propostas para{' '}
            <strong>{productType.name}</strong>.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/product-types/${id}/edit`}>Editar Tipo</Link>
        </Button>
      </div>

      <PipelineEditor
        productTypeId={id}
        initialStages={stages}
        otherProductTypes={otherProductTypes}
      />
    </div>
  )
}

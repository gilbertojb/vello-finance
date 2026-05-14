import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'

import { getPipeline, listPipelines } from '../../queries'

import { PipelineEditor } from './_components/pipeline-editor'
import { getProductTypePipeline } from './pipeline-queries'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pipeline = await getPipeline(id).catch(() => null)
  return { title: pipeline ? `Pipeline — ${pipeline.name}` : 'Pipeline' }
}

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [pipeline, stages, allPipelines] = await Promise.all([
    getPipeline(id).catch(() => null),
    getProductTypePipeline(id),
    listPipelines(true),
  ])

  if (!pipeline) notFound()

  const otherProductTypes = allPipelines.filter(
    (pt: { id: string; name: string; slug: string }) => pt.id !== id,
  )

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/pipelines" className="hover:underline">
              Esteiras
            </Link>
            <span>/</span>
            <span>{pipeline.name}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Etapas da Esteira
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure as etapas do pipeline de propostas para{' '}
            <strong>{pipeline.name}</strong>.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/pipelines/${id}/edit`}>Editar Esteira</Link>
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

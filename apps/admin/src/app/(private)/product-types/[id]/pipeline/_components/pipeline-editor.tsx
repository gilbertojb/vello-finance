'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { reorderStages } from '../pipeline-actions'
import type { PipelineStage } from '../pipeline-queries'
import { AddStageForm } from './add-stage-form'
import { DuplicateStagesSelect } from './duplicate-stages-select'
import { SortableStageCard } from './sortable-stage-card'

type ProductTypeOption = { id: string; name: string }

type Props = {
  productTypeId: string
  initialStages: PipelineStage[]
  otherProductTypes: ProductTypeOption[]
}

export function PipelineEditor({ productTypeId, initialStages, otherProductTypes }: Props) {
  const router = useRouter()
  const [stages, setStages] = useState(initialStages)
  const [, startReorderTransition] = useTransition()

  // Sincroniza estado local quando o Server Component atualiza os dados via router.refresh()
  useEffect(() => {
    setStages(initialStages)
  }, [initialStages])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)
    const newStages = arrayMove(stages, oldIndex, newIndex)
    const prevStages = stages

    setStages(newStages) // atualização otimista

    startReorderTransition(async () => {
      const result = await reorderStages(
        productTypeId,
        newStages.map((s) => s.id),
      )
      if (!result.success) {
        toast.error(result.message || 'Erro ao reordenar etapas.')
        setStages(prevStages) // reverte
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {stages.length === 0 && (
        <div className="flex items-center justify-center h-32 border border-dashed rounded-lg text-muted-foreground text-sm">
          Nenhuma etapa configurada. Adicione a primeira abaixo.
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <SortableStageCard
                key={stage.id}
                stage={stage}
                index={index}
                productTypeId={productTypeId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddStageForm productTypeId={productTypeId} />

      <div className="pt-2 border-t">
        <DuplicateStagesSelect
          productTypeId={productTypeId}
          otherProductTypes={otherProductTypes}
        />
      </div>
    </div>
  )
}

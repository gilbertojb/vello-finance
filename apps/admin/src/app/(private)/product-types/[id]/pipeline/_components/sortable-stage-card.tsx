'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'

import { deleteStage, updateStage } from '../pipeline-actions'
import type { PipelineStage } from '../pipeline-queries'
import { AddTriggerForm } from './add-trigger-form'
import { StageTriggerRow } from './stage-trigger-row'

const TIMEOUT_UNIT_LABEL: Record<string, string> = {
  minutes: 'min',
  hours: 'h',
  days: 'dias',
}

type Props = {
  stage: PipelineStage
  index: number
  productTypeId: string
}

export function SortableStageCard({ stage, index, productTypeId }: Props) {
  const router = useRouter()
  const [isDeleting, startDeleteTransition] = useTransition()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [, handleUpdateSubmit, isUpdating] = useFormState(
    updateStage,
    () => router.refresh(),
    (msg) => toast.error(msg),
  )

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteStage(stage.id, productTypeId)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.message || 'Erro ao remover etapa.')
      }
    })
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-card">
        <CardHeader className="pb-2 border-b flex-row items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded"
            aria-label="Arrastar etapa"
          >
            <GripVertical className="size-4" />
          </button>

          <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">
            {index + 1}.
          </span>

          <form onSubmit={handleUpdateSubmit} className="flex-1 flex items-center gap-3">
            <input type="hidden" name="stage_id" value={stage.id} />
            <input type="hidden" name="product_type_id" value={productTypeId} />

            <Field className="flex-1 mb-0">
              <Input
                name="name"
                defaultValue={stage.name}
                className="h-8 text-sm font-medium"
                required
                onBlur={(e) => {
                  if (e.target.value !== stage.name) {
                    e.target.form?.requestSubmit()
                  }
                }}
              />
            </Field>

            <div className="flex items-center gap-1 shrink-0">
              <FieldLabel className="text-xs text-muted-foreground whitespace-nowrap">
                Timeout:
              </FieldLabel>
              <div className="flex items-center gap-1">
                <Input
                  name="timeout_value"
                  type="number"
                  min="1"
                  defaultValue={stage.timeout_value ?? ''}
                  placeholder="—"
                  className="h-8 w-16 text-xs text-center"
                  onBlur={(e) => {
                    const changed = (e.target.value || null) !== String(stage.timeout_value ?? '')
                    if (changed) e.target.form?.requestSubmit()
                  }}
                />
                <select
                  name="timeout_unit"
                  defaultValue={stage.timeout_unit ?? 'null'}
                  onChange={(e) => {
                    e.target.form?.requestSubmit()
                  }}
                  className="h-8 rounded-md border border-input bg-background px-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="null">—</option>
                  <option value="minutes">min</option>
                  <option value="hours">h</option>
                  <option value="days">dias</option>
                </select>
              </div>
            </div>

            {isUpdating && (
              <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
            )}
          </form>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
          >
            {isDeleting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </CardHeader>

        <CardContent className="pt-3 pb-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Triggers ({stage.stage_triggers.length})
            </p>

            {stage.stage_triggers.length > 0 ? (
              <div className="space-y-0.5">
                {stage.stage_triggers.map((trigger) => (
                  <StageTriggerRow
                    key={trigger.id}
                    trigger={trigger}
                    productTypeId={productTypeId}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum trigger configurado.</p>
            )}

            <AddTriggerForm stageId={stage.id} productTypeId={productTypeId} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

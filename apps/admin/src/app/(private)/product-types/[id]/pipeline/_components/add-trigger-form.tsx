'use client'

import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'

import { createTrigger } from '../pipeline-actions'

const EVENT_OPTIONS = [
  { value: 'on_enter', label: 'Ao entrar na etapa' },
  { value: 'on_exit', label: 'Ao sair da etapa' },
  { value: 'on_timeout', label: 'Ao atingir timeout' },
]

type Props = {
  stageId: string
  productTypeId: string
}

export function AddTriggerForm({ stageId, productTypeId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [formState, handleSubmit, isPending] = useFormState(
    createTrigger,
    () => {
      toast.success('Trigger adicionado.')
      setOpen(false)
      router.refresh()
    },
    (msg) => toast.error(msg),
  )

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3" />
        Novo trigger
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-dashed rounded-md p-3 space-y-3 mt-2">
      <input type="hidden" name="stage_id" value={stageId} />
      <input type="hidden" name="product_type_id" value={productTypeId} />

      <FieldGroup className="grid grid-cols-1 gap-2">
        <Field>
          <FieldLabel htmlFor={`event_type_${stageId}`} className="text-xs">
            Evento *
          </FieldLabel>
          <select
            id={`event_type_${stageId}`}
            name="event_type"
            required
            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione...</option>
            {EVENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <FieldError errors={formState.errors?.event_type} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`webhook_url_${stageId}`} className="text-xs">
            URL do Webhook *
          </FieldLabel>
          <Input
            id={`webhook_url_${stageId}`}
            name="webhook_url"
            required
            placeholder="https://n8n.sua-empresa.com/webhook/..."
            className="h-8 text-xs"
          />
          <FieldError errors={formState.errors?.webhook_url} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`payload_template_${stageId}`} className="text-xs">
            Payload Template (JSON opcional)
          </FieldLabel>
          <textarea
            id={`payload_template_${stageId}`}
            name="payload_template"
            placeholder='{"chave": "valor"}'
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <FieldError errors={formState.errors?.payload_template} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setOpen(false)}
        >
          <X className="size-3" />
          Cancelar
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={isPending}>
          Salvar
        </Button>
      </div>
    </form>
  )
}

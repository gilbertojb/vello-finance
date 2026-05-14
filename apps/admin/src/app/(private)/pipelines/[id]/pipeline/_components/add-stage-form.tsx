'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'

import { createStage } from '../pipeline-actions'

type Props = {
  productTypeId: string
}

export function AddStageForm({ productTypeId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [formState, handleSubmit, isPending] = useFormState(
    createStage,
    () => {
      toast.success('Etapa criada.')
      setOpen(false)
      router.refresh()
    },
    (msg) => {
      toast.error(msg)
    },
  )

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed gap-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Nova Etapa
      </Button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-dashed rounded-lg p-4 space-y-4"
    >
      <input type="hidden" name="product_type_id" value={productTypeId} />

      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field className="col-span-full md:col-span-1">
          <FieldLabel htmlFor="stage_name">Nome da Etapa *</FieldLabel>
          <Input
            id="stage_name"
            name="name"
            required
            autoFocus
            placeholder="Ex: Aguardando Documentos"
          />
          <FieldError errors={formState.errors?.name} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          Criar Etapa
        </Button>
      </div>
    </form>
  )
}

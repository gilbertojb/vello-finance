'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useFormState } from '@/hooks/use-form-state'

import { createProductType, updateProductType } from '../actions'

type ProductTypeData = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
}

type Props = {
  productType?: ProductTypeData
}

export function ProductTypeForm({ productType }: Props) {
  const router = useRouter()
  const isEdit = !!productType

  const action = isEdit ? updateProductType : createProductType

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(isEdit ? 'Tipo atualizado!' : 'Tipo criado com sucesso!')
      router.push('/product-types')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={productType.id} />}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Identificação</CardTitle>
          <CardDescription>
            Nome e slug do tipo de produto. O slug não pode ser alterado após a
            criação.
          </CardDescription>
          <CardAction className="my-auto">
            <div className="flex items-center space-x-2">
              <FieldLabel htmlFor="is_active" className="cursor-pointer">
                Tipo Ativo
              </FieldLabel>
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={productType?.is_active ?? true}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Field>
              <FieldLabel htmlFor="name">Nome *</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: FGTS"
                defaultValue={productType?.name ?? ''}
              />
              <FieldError errors={formState.errors?.name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="slug">Slug *</FieldLabel>
              <Input
                id="slug"
                name="slug"
                required={!isEdit}
                placeholder="Ex: fgts"
                defaultValue={productType?.slug ?? ''}
                disabled={isEdit}
                className={isEdit ? 'opacity-50 cursor-not-allowed' : ''}
              />
              <FieldError errors={formState.errors?.slug} />
            </Field>

            <Field className="col-span-full">
              <FieldLabel htmlFor="description">Descrição</FieldLabel>
              <Input
                id="description"
                name="description"
                placeholder="Ex: Antecipação do saque-aniversário do FGTS"
                defaultValue={productType?.description ?? ''}
              />
              <FieldError errors={formState.errors?.description} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/product-types')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}

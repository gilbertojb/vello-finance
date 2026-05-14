import { Info } from 'lucide-react'

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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor'

import type { FormErrors, Pipeline, ProductWithPartners } from './product-form-types'

type Props = {
  product?: ProductWithPartners
  productTypes: Pipeline[]
  isEdit: boolean
  errors: FormErrors
}

export function ProductIdentificationCard({
  product,
  productTypes,
  isEdit,
  errors,
}: Props) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Identificação</CardTitle>
        <CardDescription>
          Defina as informações básicas e a visibilidade do produto na
          plataforma.
        </CardDescription>
        <CardAction className="my-auto">
          <div className="flex items-center space-x-2">
            <FieldLabel htmlFor="is_active" className="cursor-pointer">
              Produto Ativo
            </FieldLabel>
            <Switch
              id="is_active"
              name="is_active"
              defaultChecked={product?.is_active ?? true}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field className="col-span-full md:col-span-2">
            <FieldLabel htmlFor="name">Nome do Produto *</FieldLabel>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex: Consignado INSS"
              defaultValue={product?.name ?? ''}
            />
            <FieldError errors={errors?.name} />
          </Field>

          <Field className="col-span-full md:col-span-2">
            <FieldLabel htmlFor="product_type_id">Tipo *</FieldLabel>
            {isEdit && (
              <input type="hidden" name="product_type_id" value={product!.product_type_id} />
            )}
            <select
              id="product_type_id"
              name={isEdit ? undefined : 'product_type_id'}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required={!isEdit}
              disabled={isEdit}
              defaultValue={product?.product_type_id ?? ''}
            >
              <option value="">Selecione...</option>
              {productTypes.map((pt) => (
                <option key={pt.id} value={pt.id}>
                  {pt.name}
                </option>
              ))}
            </select>
            <FieldError errors={errors?.product_type_id} />
          </Field>

          <Field className="col-span-full md:col-span-2 mt-4">
            <div className="flex flex-col">
              <FieldLabel htmlFor="description">
                Descrição Pública
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 stroke-accent" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Informação pública exibida para clientes.</p>
                  </TooltipContent>
                </Tooltip>
              </FieldLabel>
            </div>
            <WysiwygEditor
              id="description"
              name="description"
              placeholder="Ex: Antecipação do saque-aniversário"
              defaultValue={product?.description ?? ''}
            />
            <FieldError errors={errors?.description} />
          </Field>

          <Field className="col-span-full md:col-span-2 mt-4">
            <div className="flex flex-col">
              <FieldLabel htmlFor="internal_description">
                Descrição Interna
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 stroke-accent" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Informação confidencial visível apenas para os
                      parceiros.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </FieldLabel>
            </div>
            <WysiwygEditor
              id="internal_description"
              name="internal_description"
              placeholder="Ex: Lembre-se de validar a taxa balcão 2x antes de fechar."
              defaultValue={product?.internal_description ?? ''}
            />
            <FieldError errors={errors?.internal_description} />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

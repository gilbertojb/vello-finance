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

import { createFinancialPartner, updateFinancialPartner } from '../actions'

type FinancialPartner = {
  id: string
  name: string
  api_base_url: string | null
  api_key_enc: string | null
  webhook_secret: string | null
  is_active: boolean
}

type Props = {
  partner?: FinancialPartner
}

export function FinancialPartnerForm({ partner }: Props) {
  const router = useRouter()
  const isEdit = !!partner

  const action = isEdit ? updateFinancialPartner : createFinancialPartner

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(
        isEdit
          ? 'Instituição atualizada com sucesso!'
          : 'Instituição cadastrada com sucesso!',
      )
      router.push('/financial-partners')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={partner.id} />}

      {/* Card 1 — Identificação */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Identificação</CardTitle>
          <CardDescription>
            Dados principais da instituição financeira.
          </CardDescription>
          <CardAction className="my-auto">
            <div className="flex items-center space-x-2">
              <FieldLabel htmlFor="is_active" className="cursor-pointer">
                Ativo
              </FieldLabel>
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={partner?.is_active ?? true}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="name">Nome *</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: QI Tech"
                defaultValue={partner?.name ?? ''}
              />
              <FieldError errors={formState.errors?.name} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 2 — Integração */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Integração</CardTitle>
          <CardDescription>
            Configurações de conexão com a API da instituição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field className="col-span-full md:col-span-2">
              <FieldLabel htmlFor="api_base_url">URL da API</FieldLabel>
              <Input
                id="api_base_url"
                name="api_base_url"
                type="url"
                placeholder="https://api.exemplo.com"
                defaultValue={partner?.api_base_url ?? ''}
              />
              <FieldError errors={formState.errors?.api_base_url} />
            </Field>

            {/*
              TODO: usar @vello/auth para controle de visibilidade por role (super_admin).
              Por hora, campos visíveis para todos os usuários do backoffice.
            */}
            <Field>
              <FieldLabel htmlFor="api_key_enc">Chave de API</FieldLabel>
              <Input
                id="api_key_enc"
                name="api_key_enc"
                type="password"
                placeholder={isEdit ? '••••••••' : 'Chave de acesso à API'}
                autoComplete="off"
              />
              <small className="text-muted-foreground">
                {isEdit && ' Deixe em branco para manter os valores atuais.'}
              </small>
              <FieldError errors={formState.errors?.api_key_enc} />
            </Field>

            <Field>
              <FieldLabel htmlFor="webhook_secret">Webhook Secret</FieldLabel>
              <Input
                id="webhook_secret"
                name="webhook_secret"
                type="password"
                placeholder={
                  isEdit ? '••••••••' : 'Secret para validar webhooks'
                }
                autoComplete="off"
              />
              <small className="text-muted-foreground">
                {isEdit && ' Deixe em branco para manter os valores atuais.'}
              </small>
              <FieldError errors={formState.errors?.webhook_secret} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/financial-partners')}
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

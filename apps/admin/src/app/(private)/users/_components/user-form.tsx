'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Card,
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

import { createUser, updateUser } from '../actions'
import { PasswordInput } from './password-input'

export type UserForEdit = {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
}

type Props = {
  user?: UserForEdit
  canDeactivate?: boolean
}

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'support', label: 'Suporte' },
]

export function UserForm({ user, canDeactivate = false }: Props) {
  const router = useRouter()
  const isEdit = !!user

  const action = isEdit ? updateUser : createUser

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(
        isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!',
      )
      router.push('/users')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={user.id} />}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</CardTitle>
          <CardDescription>
            {isEdit
              ? 'Atualize os dados do membro da equipe.'
              : 'Cadastre um novo membro da equipe interna.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="usuario@vellofinance.com.br"
                defaultValue={user?.email ?? ''}
                readOnly={isEdit}
                className={isEdit ? 'bg-muted' : ''}
              />
              <FieldError errors={formState.errors?.email} />
            </Field>

            <Field>
              <FieldLabel htmlFor="full_name">Nome completo *</FieldLabel>
              <Input
                id="full_name"
                name="full_name"
                required
                placeholder="Nome do colaborador"
                defaultValue={user?.full_name ?? ''}
              />
              <FieldError errors={formState.errors?.full_name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Role *</FieldLabel>
              <select
                id="role"
                name="role"
                required
                defaultValue={user?.role ?? 'support'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FieldError errors={formState.errors?.role} />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">
                {isEdit ? 'Gerar nova senha' : 'Gerar senha *'}
              </FieldLabel>
              <PasswordInput isEdit={isEdit} />
              <FieldError errors={formState.errors?.password} />
            </Field>

            {isEdit && canDeactivate && (
              <Field className="md:col-span-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FieldLabel htmlFor="is_active" className="text-base">
                      Usuário ativo
                    </FieldLabel>
                    <p className="text-sm text-muted-foreground">
                      Usuários inativos não conseguem fazer login.
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={user.is_active}
                  />
                </div>
              </Field>
            )}

            {isEdit && !canDeactivate && (
              <input type="hidden" name="is_active" value={user.is_active ? 'on' : ''} />
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/users')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEdit ? (
            'Salvar Alterações'
          ) : (
            'Cadastrar Usuário'
          )}
        </Button>
      </div>
    </form>
  )
}

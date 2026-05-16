'use client'

import { useState, useTransition } from 'react'
import { RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { createTenantUser, updateTenantUser } from '../actions'
import type { TenantUserRow } from '../queries'

function generatePassword(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&*'
  return Array.from({ length: 14 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

type Props = {
  user?: TenantUserRow
  open: boolean
  onOpenChange: (v: boolean) => void
}

export function UserSheet({ user, open, onOpenChange }: Props) {
  const isEdit = Boolean(user)
  const [password, setPassword] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    setPassword(generatePassword())
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('password', password)

    startTransition(async () => {
      const result = isEdit
        ? await updateTenantUser(user!.id, formData)
        : await createTenantUser(formData)

      if (result.success) {
        toast.success(result.message ?? (isEdit ? 'Usuário atualizado.' : 'Usuário criado!'))
        onOpenChange(false)
        setPassword('')
      } else {
        toast.error(result.message ?? 'Erro ao salvar.')
      }
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{isEdit ? 'Editar usuário' : 'Novo usuário'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-4 pb-6">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="full_name">Nome completo</Label>
            <Input
              id="full_name"
              name="full_name"
              placeholder="Ex: João da Silva"
              defaultValue={user?.full_name ?? ''}
            />
          </div>

          {!isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="usuario@empresa.com.br"
                required
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="role">
              Perfil <span className="text-destructive">*</span>
            </Label>
            <select
              id="role"
              name="role"
              defaultValue={user?.role ?? 'tenant_operator'}
              required
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="tenant_admin">Administrador</option>
              <option value="tenant_operator">Operador</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">
              Senha {!isEdit && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex gap-2">
              <Input
                id="password"
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? 'Deixe em branco para não alterar' : 'Mínimo 8 caracteres'}
                required={!isEdit}
                className="font-mono"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleGenerate} title="Gerar senha aleatória">
                <RefreshCw className="size-4" />
              </Button>
            </div>
          </div>

          <Button type="submit" disabled={isPending} className="mt-2">
            {isPending ? 'Salvando...' : isEdit ? 'Salvar alterações' : 'Criar usuário'}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}

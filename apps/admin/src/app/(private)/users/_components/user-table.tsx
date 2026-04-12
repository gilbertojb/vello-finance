'use client'

import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { deleteUser, updateUser } from '../actions'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

type Permissions = {
  canEdit: boolean
  userPermissions: Record<string, { canDelete: boolean; canDeactivate: boolean }>
}

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: 'Super Admin',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  admin: {
    label: 'Admin',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  financial: {
    label: 'Financeiro',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  support: {
    label: 'Suporte',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300',
  },
}

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_LABELS[role] ?? { label: role, className: 'bg-gray-100 text-gray-800' }
  return <Badge className={config.className}>{config.label}</Badge>
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
      Ativo
    </Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300">
      Inativo
    </Badge>
  )
}

function UserActions({
  user,
  permissions,
}: {
  user: UserRow
  permissions: Permissions
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const userPerms = permissions.userPermissions[user.id]
  const showDeactivate = userPerms?.canDeactivate ?? false
  const showDelete = userPerms?.canDelete ?? false

  function handleToggleActive() {
    if (!confirm(user.is_active ? 'Desativar este usuário?' : 'Reativar este usuário?')) return

    const formData = new FormData()
    formData.set('id', user.id)
    formData.set('full_name', user.full_name ?? '')
    formData.set('role', user.role)
    formData.set('is_active', user.is_active ? '' : 'on')
    formData.set('password', '')

    startTransition(async () => {
      const result = await updateUser(formData)
      if (result.success) {
        toast.success(user.is_active ? 'Usuário desativado.' : 'Usuário reativado.')
      } else {
        toast.error(result.message || 'Erro ao atualizar status.')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Excluir este usuário permanentemente? Esta ação não pode ser desfeita.')) return

    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (result.success) {
        toast.success('Usuário excluído.')
      } else {
        toast.error(result.message || 'Erro ao excluir.')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {permissions.canEdit && (
          <DropdownMenuItem asChild>
            <Link href={`/users/${user.id}/edit`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </DropdownMenuItem>
        )}

        {showDeactivate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={user.is_active ? 'text-destructive focus:text-destructive' : ''}
              disabled={isPending}
              onClick={handleToggleActive}
            >
              <Power className="size-4" />
              {user.is_active ? 'Desativar' : 'Reativar'}
            </DropdownMenuItem>
          </>
        )}

        {showDelete && (
          <>
            {!showDeactivate && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UserTable({
  users,
  permissions,
}: {
  users: ReadonlyArray<UserRow>
  permissions: Permissions
}) {
  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhum usuário cadastrado.</p>
        {permissions.canEdit && (
          <Button variant="link" asChild className="mt-2">
            <Link href="/users/new">Cadastrar o primeiro usuário</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border bg-card">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Nome
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Email
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Role
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle font-medium">
                {user.full_name || '—'}
              </td>
              <td className="p-4 align-middle text-muted-foreground text-xs">
                {user.email}
              </td>
              <td className="p-4 align-middle">
                <RoleBadge role={user.role} />
              </td>
              <td className="p-4 align-middle">
                <StatusBadge isActive={user.is_active} />
              </td>
              <td className="p-4 align-middle text-right">
                <UserActions user={user} permissions={permissions} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

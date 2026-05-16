'use client'

import { useState, useTransition } from 'react'
import { UserPlus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { UserSheet } from './user-sheet'
import { toggleTenantUser, deleteTenantUser } from '../actions'
import type { TenantUserRow } from '../queries'

const ROLE_LABELS: Record<string, string> = {
  tenant_admin:    'Administrador',
  tenant_operator: 'Operador',
}

function Initials({ name, email }: { name: string | null; email: string | null }) {
  const source = name ?? email ?? '?'
  const parts = source.split(/[\s@]/).filter(Boolean)
  const letters =
    parts.length >= 2
      ? (parts[0]![0] ?? '') + (parts[1]![0] ?? '')
      : source.slice(0, 2)
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary">
      {letters.toUpperCase()}
    </div>
  )
}

type Props = {
  users: TenantUserRow[]
  currentUserId: string
}

export function UsersList({ users, currentUserId }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<TenantUserRow | undefined>(undefined)
  const [isPending, startTransition] = useTransition()

  function handleNew() {
    setEditingUser(undefined)
    setSheetOpen(true)
  }

  function handleEdit(user: TenantUserRow) {
    setEditingUser(user)
    setSheetOpen(true)
  }

  function handleToggle(user: TenantUserRow, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleTenantUser(user.id, isActive)
      if (!result.success) {
        toast.error(result.message ?? 'Erro ao atualizar usuário.')
      } else {
        toast.success(isActive ? 'Usuário ativado.' : 'Usuário desativado.')
      }
    })
  }

  function handleDelete(user: TenantUserRow) {
    const confirmed = window.confirm(
      `Tem certeza que deseja remover "${user.full_name ?? user.email}"? Esta ação não pode ser desfeita.`,
    )
    if (!confirmed) return

    startTransition(async () => {
      const result = await deleteTenantUser(user.id)
      if (!result.success) {
        toast.error(result.message ?? 'Erro ao remover usuário.')
      } else {
        toast.success('Usuário removido.')
      }
    })
  }

  return (
    <>
      <UserSheet user={editingUser} open={sheetOpen} onOpenChange={setSheetOpen} />

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground/55">
            {users.length} {users.length === 1 ? 'membro' : 'membros'} com acesso ao painel
          </p>
          <Button onClick={handleNew} size="sm" className="gap-2">
            <UserPlus className="size-4" />
            Novo usuário
          </Button>
        </div>

        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
            <div className="grid size-12 place-items-center rounded-full bg-muted">
              <UserPlus className="size-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-base font-medium text-foreground">Nenhum usuário cadastrado</h3>
            <p className="mt-2 max-w-sm text-sm text-foreground/55">
              Adicione membros da sua equipe para que possam acessar o painel da loja.
            </p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-card">
            {users.map((user) => {
              const isSelf = user.id === currentUserId
              return (
                <div
                  key={user.id}
                  className="flex items-center gap-4 px-5 py-4"
                >
                  <Initials name={user.full_name} email={user.email} />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {user.full_name ?? user.email ?? '—'}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                          user.role === 'tenant_admin'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-foreground/60'
                        }`}
                      >
                        {ROLE_LABELS[user.role] ?? user.role}
                      </span>
                      {!user.is_active && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/40">
                          Inativo
                        </span>
                      )}
                      {isSelf && (
                        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground/40">
                          Você
                        </span>
                      )}
                    </div>
                    {user.email && user.full_name && (
                      <p className="mt-0.5 truncate text-xs text-foreground/50">{user.email}</p>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <Switch
                      checked={user.is_active}
                      onCheckedChange={(checked) => handleToggle(user, checked)}
                      disabled={isPending || isSelf}
                      size="sm"
                      title={isSelf ? 'Não é possível desativar a própria conta' : 'Alternar status do usuário'}
                    />

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleEdit(user)}
                      title="Editar usuário"
                    >
                      <Pencil className="size-3.5" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(user)}
                      disabled={isPending || isSelf}
                      title={isSelf ? 'Não é possível remover a própria conta' : 'Remover usuário'}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive disabled:text-foreground/30"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}

'use client'

import { MoreHorizontal, Pencil, PowerOff, RefreshCw, Zap } from 'lucide-react'
import Link from 'next/link'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { setTenantStatus } from '../actions'
import { TenantStatusBadge } from './tenant-status-badge'

type TenantRow = {
  id: string
  name: string
  slug: string
  status: string
  created_at: string
  welcome_email_sent_at: string | null
}

function StatusAction({ tenant }: { tenant: TenantRow }) {
  const [isPending, startTransition] = useTransition()

  function changeStatus(newStatus: 'active' | 'suspended' | 'cancelled') {
    startTransition(async () => {
      const result = await setTenantStatus(tenant.id, newStatus)
      if (result.success) {
        toast.success('Status atualizado com sucesso.')
      } else {
        toast.error(result.message || 'Erro ao atualizar status.')
      }
    })
  }

  if (tenant.status === 'cancelled') return null

  return (
    <>
      <DropdownMenuSeparator />
      {tenant.status === 'active' && (
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          disabled={isPending}
          onClick={() => changeStatus('suspended')}
        >
          <PowerOff className="size-4" />
          Inativar
        </DropdownMenuItem>
      )}
      {tenant.status === 'pending' && (
        <DropdownMenuItem
          disabled={isPending}
          onClick={() => changeStatus('active')}
        >
          <Zap className="size-4" />
          Ativar
        </DropdownMenuItem>
      )}
      {tenant.status === 'suspended' && (
        <DropdownMenuItem
          disabled={isPending}
          onClick={() => changeStatus('active')}
        >
          <RefreshCw className="size-4" />
          Reativar
        </DropdownMenuItem>
      )}
    </>
  )
}

export function TenantTable({
  tenants,
}: {
  tenants: ReadonlyArray<TenantRow>
}) {
  if (!tenants || tenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhum parceiro cadastrado.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/tenants/new">Cadastrar o primeiro parceiro</Link>
        </Button>
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
              Slug
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Criado em
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {tenants.map((tenant) => (
            <tr
              key={tenant.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle font-medium">{tenant.name}</td>
              <td className="p-4 align-middle text-muted-foreground text-xs">
                {tenant.slug}.vellofinance.com.br
              </td>
              <td className="p-4 align-middle">
                <div className="flex items-center gap-2">
                  <TenantStatusBadge status={tenant.status} />
                  {!tenant.welcome_email_sent_at && tenant.status === 'pending' && (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Email pendente
                    </span>
                  )}
                </div>
              </td>
              <td className="p-4 align-middle text-muted-foreground text-xs">
                {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td className="p-4 align-middle text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="size-4" />
                      <span className="sr-only">Ações</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/tenants/${tenant.id}/edit`}>
                        <Pencil className="size-4" />
                        Editar
                      </Link>
                    </DropdownMenuItem>
                    <StatusAction tenant={tenant} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

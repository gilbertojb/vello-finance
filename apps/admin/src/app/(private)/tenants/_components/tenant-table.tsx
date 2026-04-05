'use client'

import { Pencil } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { TenantStatusBadge } from './tenant-status-badge'

type TenantRow = {
  id: string
  name: string
  slug: string
  status: string
  created_at: string
}

export function TenantTable({ tenants }: { tenants: ReadonlyArray<TenantRow> }) {
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
                <TenantStatusBadge status={tenant.status} />
              </td>
              <td className="p-4 align-middle text-muted-foreground text-xs">
                {new Date(tenant.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td className="p-4 align-middle text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/tenants/${tenant.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import { GitBranch, Pencil } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PipelineRow = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
}

export function PipelineTable({
  pipelines,
}: {
  pipelines: ReadonlyArray<PipelineRow>
}) {
  if (!pipelines || pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhuma esteira cadastrada.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/pipelines/new">Cadastrar a primeira esteira</Link>
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
              Descrição
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
          {pipelines.map((pt) => (
            <tr
              key={pt.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle font-medium">{pt.name}</td>
              <td className="p-4 align-middle text-muted-foreground text-xs font-mono">
                {pt.slug}
              </td>
              <td className="p-4 align-middle text-muted-foreground">
                {pt.description || '-'}
              </td>
              <td className="p-4 align-middle">
                {pt.is_active ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                    Ativo
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                    Inativo
                  </Badge>
                )}
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/pipelines/${pt.id}/pipeline`}>
                      <GitBranch className="size-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/pipelines/${pt.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

type PartnerRow = {
  id: string
  name: string
  api_base_url: string | null
  is_active: boolean
}

export function FinancialPartnerTable({
  partners,
}: {
  partners: ReadonlyArray<PartnerRow>
}) {
  if (!partners || partners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhuma instituição financeira cadastrada.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/financial-partners/new">Cadastrar a primeira</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border bg-card">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Nome
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              URL da API
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
          {partners.map((partner) => (
            <tr
              key={partner.id}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <td className="p-4 align-middle font-medium">{partner.name}</td>
              <td className="p-4 align-middle text-muted-foreground text-xs">
                {partner.api_base_url ?? '-'}
              </td>
              <td className="p-4 align-middle">
                {partner.is_active ? (
                  <span className="text-2xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Ativo
                  </span>
                ) : (
                  <span className="text-2xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    Inativo
                  </span>
                )}
              </td>
              <td className="p-4 align-middle text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/financial-partners/${partner.id}/edit`}>
                    Editar
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

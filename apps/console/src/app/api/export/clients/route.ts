import { type NextRequest, NextResponse } from 'next/server'
import { listLeads } from '@/app/(private)/clients/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const filters = {
    stage:   searchParams.get('stage') ?? undefined,
    product: searchParams.get('product') ?? undefined,
    from:    searchParams.get('from') ?? undefined,
    to:      searchParams.get('to') ?? undefined,
  }

  const leads = await listLeads(filters)

  const header = 'Nome,Produto,Estágio,Valor solicitado,Origem,Data\n'
  const rowLines = leads.map((l) =>
    [
      `"${l.clientName}"`,
      `"${l.product}"`,
      `"${l.stage}"`,
      l.desiredAmount,
      `"${l.origin}"`,
      `"${new Date(l.createdAt).toLocaleDateString('pt-BR')}"`,
    ].join(','),
  )

  return new NextResponse(header + rowLines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads.csv"',
    },
  })
}

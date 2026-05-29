import { type NextRequest, NextResponse } from 'next/server'
import { getSalesOriginData, type SalesOriginFilters } from '@/app/(private)/relatorios/origem-vendas/queries'

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const filters: SalesOriginFilters = {
    product: searchParams.get('product') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  }

  const rows = await getSalesOriginData(filters)

  const header = ['Origem', 'Propostas aprovadas', 'Volume contratado', 'Comissão gerada']
  const lines = rows.map((r) =>
    [r.origin, r.approvedProposals, brl(r.contractedVolume), brl(r.generatedCommission)].join(','),
  )

  const csv = [header.join(','), ...lines].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="origem-vendas.csv"',
    },
  })
}

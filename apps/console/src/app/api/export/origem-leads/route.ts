import { type NextRequest, NextResponse } from 'next/server'
import { getLeadOriginData, type LeadOriginFilters } from '@/app/(private)/relatorios/origem-leads/queries'

const brl = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const filters: LeadOriginFilters = {
    product: searchParams.get('product') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
  }

  const rows = await getLeadOriginData(filters)

  const header = ['Origem', 'Leads', 'Convertidos', 'Taxa de conversão', 'Volume solicitado']
  const lines = rows.map((r) =>
    [r.origin, r.leads, r.converted, `${r.conversionRate}%`, brl(r.requestedVolume)].join(','),
  )

  const csv = [header.join(','), ...lines].join('\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="origem-leads.csv"',
    },
  })
}

import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Download } from 'lucide-react'
import {
  getSalesOriginData,
  getSalesOriginKpis,
  listSalesOriginProducts,
  type SalesOriginFilters,
} from './queries'
import { OrigemVendasKpiCards } from './_components/origem-vendas-kpi-cards'
import { OrigemVendasFilters } from './_components/origem-vendas-filters'
import { OrigemVendasTable } from './_components/origem-vendas-table'

export const metadata: Metadata = { title: 'Origem de Vendas' }

interface Props {
  searchParams: Promise<{ product?: string; from?: string; to?: string }>
}

export default async function OrigemVendasPage({ searchParams }: Props) {
  const { product, from, to } = await searchParams

  const filters: SalesOriginFilters = { product, from, to }

  const exportParams = new URLSearchParams()
  if (product) exportParams.set('product', product)
  if (from) exportParams.set('from', from)
  if (to) exportParams.set('to', to)

  const [kpis, rows, products] = await Promise.all([
    getSalesOriginKpis(filters),
    getSalesOriginData(filters),
    listSalesOriginProducts(),
  ])

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
            Relatórios · Vendas
          </span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Origem de Vendas<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            De onde vieram as propostas aprovadas? Veja o volume e comissões por canal.
          </p>
        </div>
        <a
          href={`/api/export/origem-vendas?${exportParams.toString()}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground"
        >
          <Download size={14} /> Exportar CSV
        </a>
      </div>

      <div className="mb-6">
        <OrigemVendasKpiCards kpis={kpis} />
      </div>

      <div className="mb-4">
        <Suspense>
          <OrigemVendasFilters products={products} />
        </Suspense>
      </div>

      <OrigemVendasTable rows={rows} />
    </div>
  )
}

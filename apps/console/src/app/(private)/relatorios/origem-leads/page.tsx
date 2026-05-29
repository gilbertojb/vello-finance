import type { Metadata } from 'next'
import { Suspense } from 'react'
import { Download } from 'lucide-react'
import {
  getLeadOriginData,
  getLeadOriginKpis,
  listLeadOriginProducts,
  type LeadOriginFilters,
} from './queries'
import { OrigemLeadsKpiCards } from './_components/origem-leads-kpi-cards'
import { OrigemLeadsFilters } from './_components/origem-leads-filters'
import { OrigemLeadsTable } from './_components/origem-leads-table'

export const metadata: Metadata = { title: 'Origem de Leads' }

interface Props {
  searchParams: Promise<{ product?: string; from?: string; to?: string }>
}

export default async function OrigemLeadsPage({ searchParams }: Props) {
  const { product, from, to } = await searchParams

  const filters: LeadOriginFilters = { product, from, to }

  const exportParams = new URLSearchParams()
  if (product) exportParams.set('product', product)
  if (from) exportParams.set('from', from)
  if (to) exportParams.set('to', to)

  const [kpis, rows, products] = await Promise.all([
    getLeadOriginKpis(filters),
    getLeadOriginData(filters),
    listLeadOriginProducts(),
  ])

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
            Relatórios · Origem
          </span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Origem de Leads<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            De onde vieram os leads? Veja a distribuição por canal de origem.
          </p>
        </div>
        <a
          href={`/api/export/origem-leads?${exportParams.toString()}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground"
        >
          <Download size={14} /> Exportar CSV
        </a>
      </div>

      <div className="mb-6">
        <OrigemLeadsKpiCards kpis={kpis} />
      </div>

      <div className="mb-4">
        <Suspense>
          <OrigemLeadsFilters products={products} />
        </Suspense>
      </div>

      <OrigemLeadsTable rows={rows} />
    </div>
  )
}

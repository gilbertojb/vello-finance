import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getFinanceiroKpis, listComissoes, type FinanceiroFilters } from './queries'
import { FinanceiroKpiCards } from './_components/financeiro-kpi-cards'
import { FinanceiroFilters as FiltersBar } from './_components/financeiro-filters'
import { FinanceiroTable } from './_components/financeiro-table'

export const metadata: Metadata = { title: 'Financeiro' }

interface Props {
  searchParams: Promise<{ status?: string; de?: string; ate?: string }>
}

export default async function FinanceiroPage({ searchParams }: Props) {
  const sp = await searchParams

  const filters: FinanceiroFilters = {
    status: sp.status === 'a_receber' || sp.status === 'pago' ? sp.status : undefined,
    de: sp.de,
    ate: sp.ate,
  }

  const [kpis, rows] = await Promise.all([
    getFinanceiroKpis(),
    listComissoes(filters),
  ])

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
            Financeiro · Comissões
          </span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Financeiro<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            Acompanhe suas comissões a receber e recebidas por proposta aprovada.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <FinanceiroKpiCards kpis={kpis} />
      </div>

      <div className="mb-4">
        <Suspense>
          <FiltersBar />
        </Suspense>
      </div>

      <FinanceiroTable rows={rows} />
    </div>
  )
}

import type { Metadata } from 'next'
import { Download } from 'lucide-react'

import { ClientsFilters } from './_components/clients-filters'
import { ClientsKpiCards } from './_components/clients-kpi-cards'
import { ClientsTable } from './_components/clients-table'
import { getClientsKpis, listLeads, listProducts } from './queries'

export const metadata: Metadata = { title: 'Clientes' }

interface Props {
  searchParams: Promise<{ stage?: string; product?: string; de?: string; ate?: string }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const filters = await searchParams
  const [leads, kpis, products] = await Promise.all([
    listLeads(filters),
    getClientsKpis(filters),
    listProducts(),
  ])

  const csvParams = new URLSearchParams(
    Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== undefined),
    ) as Record<string, string>,
  )

  return (
    <div className="mx-auto w-full max-w-10/12 p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
            Originação · Jornada do lead
          </span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Clientes<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            Visão unificada da jornada — de quem abandonou a simulação até quem contratou.
          </p>
        </div>
        <a
          href={`/api/export/clients?${csvParams.toString()}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground no-underline"
        >
          <Download size={14} /> Exportar CSV
        </a>
      </div>

      <ClientsKpiCards
        total={kpis.total}
        abandonaram={kpis.abandonaram}
        emContratacao={kpis.emContratacao}
        contrataram={kpis.contrataram}
      />

      <div className="mt-4">
        <ClientsFilters products={products} />
      </div>

      <div className="mt-3.5">
        <ClientsTable leads={leads} />
      </div>
    </div>
  )
}

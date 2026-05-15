import type { Metadata } from 'next'
import { Download, Plus } from 'lucide-react'

import { FunnelChart } from './_components/funnel-chart'
import { KpiCards } from './_components/kpi-cards'
import { ProductMixChart } from './_components/product-mix-chart'
import { SimulationsList } from './_components/simulations-list'
import {
  getProductMix,
  getSimulationFunnel,
  getSimulationKpis,
  getSimulationSparklines,
  listSimulations,
} from './queries'

export const metadata: Metadata = { title: 'Simulações' }

export default async function SimulationsPage() {
  const [simulations, kpis, sparklines, funnel, productMix] = await Promise.all([
    listSimulations(),
    getSimulationKpis(),
    getSimulationSparklines(),
    getSimulationFunnel(),
    getProductMix(),
  ])

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      {/* Page header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
            Originação · Pré-qualificados
          </span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Simulações<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            Leads que iniciaram ou concluíram uma simulação na landing. Cada lead recebe um score
            de 0–100 estimando a probabilidade de conversão em proposta.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground"
          >
            <Download size={14} /> Exportar CSV
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Plus size={14} /> Nova simulação
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} sparklines={sparklines} />

      {/* Simulations Table */}
      <div className="mt-3.5">
        <SimulationsList simulations={simulations} />
      </div>

      {/* Bottom charts: Funnel (2/3) + Mix (1/3) */}
      <div className="mt-3.5 grid grid-cols-3 gap-3.5">
        <div className="col-span-2">
          <FunnelChart data={funnel} />
        </div>
        <div>
          <ProductMixChart data={productMix} />
        </div>
      </div>
    </div>
  )
}

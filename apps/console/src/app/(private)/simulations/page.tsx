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
          <span className="text-[11px] font-medium uppercase tracking-[.18em] text-foreground/45">
            Originação · Pré-qualificados
          </span>
          <h1 className="mb-2 mt-1 text-[42px] font-semibold leading-none tracking-tight text-foreground">
            Simulações<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-sm leading-normal text-foreground/55">
            Leads que iniciaram ou concluíram uma simulação na landing. Cada lead recebe um score
            de 0–100 estimando a probabilidade de conversão em proposta.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-[10px] text-[13px] font-medium text-foreground"
          >
            <Download size={14} /> Exportar CSV
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-primary px-4 py-[10px] text-[13px] font-semibold text-primary-foreground"
          >
            <Plus size={14} /> Nova simulação
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} sparklines={sparklines} />

      {/* Simulations Table */}
      <div className="mt-[14px]">
        <SimulationsList simulations={simulations} />
      </div>

      {/* Bottom charts */}
      <div className="mt-[14px] grid gap-[14px] lg:grid-cols-[1fr_380px]">
        <FunnelChart data={funnel} />
        <ProductMixChart data={productMix} />
      </div>
    </div>
  )
}

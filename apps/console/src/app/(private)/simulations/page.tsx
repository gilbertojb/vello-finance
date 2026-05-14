import type { Metadata } from 'next'
import { Download, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

import { SimulationsList } from './_components/simulations-list'
import { KpiCards } from './_components/kpi-cards'
import { FunnelChart } from './_components/funnel-chart'
import { ProductMixChart } from './_components/product-mix-chart'
import {
  listSimulations,
  getSimulationKpis,
  getSimulationSparklines,
  getSimulationFunnel,
  getProductMix,
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
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb + Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">
            Originação · Pré-qualificados
          </p>
          <h1 className="font-heading text-4xl italic font-medium tracking-tight">Simulações.</h1>
          <p className="mt-2 max-w-lg text-sm text-muted-foreground">
            Leads que iniciaram ou concluíram uma simulação na landing. Cada lead recebe um score de 0–100 estimando a probabilidade de conversão em proposta.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Exportar CSV
          </Button>
          <Button size="sm" className="gap-2 bg-[oklch(0.75_0.15_70)] text-[oklch(0.10_0_0)] hover:bg-[oklch(0.70_0.15_70)]">
            <Plus className="size-4" />
            Nova simulação
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} sparklines={sparklines} />

      {/* Simulations Table */}
      <SimulationsList simulations={simulations} />

      {/* Bottom charts */}
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <FunnelChart data={funnel} />
        <ProductMixChart data={productMix} />
      </div>
    </div>
  )
}

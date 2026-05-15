import type { Metadata } from 'next'

import { CalendarDays, Download } from 'lucide-react'

import { ActivityFeed } from './_components/activity-feed'
import { KpiCards } from './_components/kpi-cards'
import { PipelineDistribution } from './_components/pipeline-distribution'
import { ProductVolume } from './_components/product-volume'
import { TrendChart } from './_components/trend-chart'

import {
  getDashboardKpis,
  getPipelineData,
  getProductVolume,
  getRecentActivity,
  getTrendData,
} from './queries'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const [kpis, trend, pipeline, products, activity] = await Promise.all([
    getDashboardKpis(),
    getTrendData(),
    getPipelineData(),
    getProductVolume(),
    getRecentActivity(),
  ])

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      {/* Page header */}
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
            Visão Geral · Resumo executivo
          </span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Dashboard<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            Visão consolidada da originação. Simulações qualificam leads na
            landing; propostas viram contratos. Últimos 30 dias.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground"
          >
            <CalendarDays size={14} /> Últimos 30 dias
          </button>
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-none bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Row 2: Trend (2/3) + Pipeline (1/3) */}
      <div className="mt-3.5 grid grid-cols-3 gap-3.5">
        <div className="col-span-2">
          <TrendChart data={trend} />
        </div>
        <div>
          <PipelineDistribution data={pipeline} />
        </div>
      </div>

      {/* Row 3: Products (1/3) + Activity (2/3) */}
      <div className="mt-3.5 grid grid-cols-3 gap-3.5">
        <div>
          <ProductVolume data={products} />
        </div>
        <div className="col-span-2">
          <ActivityFeed activities={activity} />
        </div>
      </div>
    </div>
  )
}

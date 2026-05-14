import type { Metadata } from 'next'
import { CalendarDays, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { ActivityFeed } from './_components/activity-feed'
import { ConversionFunnel } from './_components/conversion-funnel'
import { KpiCards } from './_components/kpi-cards'
import { PipelineDistribution } from './_components/pipeline-distribution'
import { ProductVolume } from './_components/product-volume'
import { TrendChart } from './_components/trend-chart'
import {
  getDashboardKpis,
  getFunnelData,
  getPipelineData,
  getProductVolume,
  getRecentActivity,
  getTrendData,
} from './queries'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const [kpis, trend, pipeline, products, funnel, activity] = await Promise.all([
    getDashboardKpis(),
    getTrendData(),
    getPipelineData(),
    getProductVolume(),
    getFunnelData(),
    getRecentActivity(),
  ])

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-3xl font-medium">Dashboard</h1>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Visão consolidada da originação. Simulações qualificam leads na landing; propostas
            viram contratos. Últimos 30 dias.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <CalendarDays className="size-4" />
            Últimos 30 dias
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="size-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Row 2: Trend + Pipeline */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={trend} />
        </div>
        <PipelineDistribution data={pipeline} />
      </div>

      {/* Row 3: Products + Funnel + Activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        <ProductVolume data={products} />
        <ConversionFunnel data={funnel} />
        <ActivityFeed activities={activity} />
      </div>
    </div>
  )
}

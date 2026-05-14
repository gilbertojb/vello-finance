import type { Metadata } from 'next'
import { Download, CalendarDays } from 'lucide-react'

import { KpiCards } from './_components/kpi-cards'
import { TrendChart } from './_components/trend-chart'
import { PipelineDistribution } from './_components/pipeline-distribution'
import { ProductVolume } from './_components/product-volume'
import { ActivityFeed } from './_components/activity-feed'
import {
  getDashboardKpis,
  getTrendData,
  getPipelineData,
  getProductVolume,
  getRecentActivity,
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
    <div style={{ padding: 32, maxWidth: 1600, width: '100%', margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, gap: 24, flexWrap: 'wrap' }}>
        <div>
          <span style={{ fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(246,239,228,.45)', fontWeight: 500 }}>
            Visão Geral · Resumo executivo
          </span>
          <h1 style={{ fontFamily: "'Playfair Display', 'Georgia', serif", fontStyle: 'italic', fontWeight: 400, fontSize: 42, letterSpacing: '-.02em', margin: '4px 0 8px', lineHeight: 1, color: '#f6efe4' }}>
            Dashboard<span style={{ color: '#e9c77b' }}>.</span>
          </h1>
          <p style={{ color: 'rgba(246,239,228,.55)', fontSize: 14, lineHeight: 1.5, maxWidth: 520, margin: 0 }}>
            Visão consolidada da originação. Simulações qualificam leads na landing; propostas viram contratos. Últimos 30 dias.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button style={{ padding: '10px 16px', borderRadius: 9, fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 8, color: '#f6efe4', border: '1px solid rgba(233,199,123,.16)', background: 'rgba(246,239,228,.04)', cursor: 'pointer' }}>
            <CalendarDays size={14} /> Últimos 30 dias
          </button>
          <button style={{ padding: '10px 16px', borderRadius: 9, fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(180deg,#f3d488,#d4a94f)', color: '#241608', cursor: 'pointer', border: 'none' }}>
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards kpis={kpis} />

      {/* Row 2: Trend (2/3) + Pipeline (1/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginTop: 14 }}>
        <TrendChart data={trend} />
        <PipelineDistribution data={pipeline} />
      </div>

      {/* Row 3: Products (1/3) + Activity (2/3) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14, marginTop: 14 }}>
        <ProductVolume data={products} />
        <ActivityFeed activities={activity} />
      </div>
    </div>
  )
}

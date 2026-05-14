import { Activity, CheckCircle, TrendingUp, Wallet } from 'lucide-react'

import { Card } from '@/components/ui/card'

import type { DashboardKpis } from '../queries'

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  kpis: DashboardKpis
}

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
        positive
          ? 'bg-emerald-500/15 text-emerald-400'
          : 'bg-red-500/15 text-red-400'
      }`}
    >
      {positive ? '+' : ''}
      {value.toFixed(1)}%
    </span>
  )
}

export function KpiCards({ kpis }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Card 1 — Volume contratado */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Volume Contratado
          </p>
          <Wallet className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-2 text-2xl font-bold text-amber-400">
          {brl(kpis.volumeContratado)}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <GrowthBadge value={kpis.simsGrowth} />
          <span className="text-[11px] text-muted-foreground">
            {kpis.activeProposals} propostas ativas
          </span>
        </div>
      </Card>

      {/* Card 2 — Simulações 30d */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Simulações (30D)
          </p>
          <Activity className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-2 text-2xl font-bold">
          {kpis.sims30Count.toLocaleString('pt-BR')}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <GrowthBadge value={kpis.simsGrowth} />
          <span className="text-[11px] text-muted-foreground">
            {brl(kpis.sims30Volume)} simulados
          </span>
        </div>
      </Card>

      {/* Card 3 — Conversão */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Taxa de Conversão
          </p>
          <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-2 text-2xl font-bold">
          {kpis.conversionRate.toFixed(1)}%
        </p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">
          simulação → proposta
        </p>
      </Card>

      {/* Card 4 — Desembolsado */}
      <Card className="p-5">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Desembolsado
          </p>
          <CheckCircle className="size-4 shrink-0 text-muted-foreground" />
        </div>
        <p className="mt-2 text-2xl font-bold">
          {brl(kpis.disbursed)}
        </p>
        <p className="mt-1.5 text-[11px] text-muted-foreground">esta semana</p>
      </Card>
    </div>
  )
}

import { Activity, CheckCircle, TrendingUp, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { DashboardKpis } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function Spark({ data, color = 'var(--primary)' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const w = 80, h = 28
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / (max - min || 1)) * h
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={color}
        fillOpacity="0.08"
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Delta({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11.5px] font-semibold',
        up ? 'text-success' : 'text-destructive',
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

interface CardProps {
  label: string
  value: string
  primaryVal?: boolean
  featured?: boolean
  icon: React.ReactNode
  spark: number[]
  sparkColor?: string
  delta: React.ReactNode
  foot?: string
}

function KpiCard({
  label,
  value,
  primaryVal,
  featured,
  icon,
  spark,
  sparkColor = 'var(--primary)',
  delta,
  foot,
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] border p-5',
        featured
          ? 'border-primary/20 bg-primary/8'
          : 'border-primary/10 bg-card',
      )}
    >
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[.18em] text-foreground/55">
          {label}
        </span>
        <span className="grid size-[30px] place-items-center rounded-lg bg-primary/8 text-primary">
          {icon}
        </span>
      </div>

      <div
        className={cn(
          'text-[30px] font-semibold leading-none tracking-[-0.025em]',
          primaryVal ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </div>

      <div className="mt-3.5 flex items-center justify-between text-[11.5px]">
        <div className="flex flex-col gap-0.5">
          {delta}
          {foot && (
            <span className="text-[10.5px] text-foreground/38">{foot}</span>
          )}
        </div>
        <Spark data={spark} color={sparkColor} />
      </div>
    </div>
  )
}

interface Props {
  kpis: DashboardKpis
}

export function KpiCards({ kpis }: Props) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      <KpiCard
        featured
        primaryVal
        label="Volume Contratado"
        value={brl(kpis.volumeContratado)}
        icon={<Wallet size={15} />}
        spark={[38, 42, 40, 45, 48, 52, 50, 55, 60, 58, 62, 65]}
        delta={<Delta value={kpis.simsGrowth} />}
        foot={`${kpis.activeProposals} propostas ativas`}
      />

      <KpiCard
        label="Simulações (30d)"
        value={kpis.sims30Count.toLocaleString('pt-BR')}
        icon={<Activity size={15} />}
        spark={[12, 14, 11, 18, 16, 22, 28, 26, 31, 29, 34, 38]}
        sparkColor="var(--success)"
        delta={<Delta value={kpis.simsGrowth} />}
        foot={`${brl(kpis.sims30Volume)} simulados`}
      />

      <KpiCard
        label="Taxa de Conversão"
        value={`${kpis.conversionRate.toFixed(1)}%`}
        icon={<TrendingUp size={15} />}
        spark={[8, 9, 10, 9, 10, 11, 10, 11, 12, 11, 12, 12]}
        sparkColor="var(--muted-foreground)"
        delta={<Delta value={0.0} />}
        foot="simulação → proposta"
      />

      <KpiCard
        label="Desembolsado"
        value={brl(kpis.disbursed)}
        icon={<CheckCircle size={15} />}
        spark={[5, 8, 6, 9, 11, 10, 13, 12, 11, 14, 13, 15]}
        sparkColor="var(--destructive)"
        delta={<Delta value={kpis.disbursedGrowth} />}
        foot="esta semana"
      />
    </div>
  )
}

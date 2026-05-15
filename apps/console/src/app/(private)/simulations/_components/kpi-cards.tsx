import { Activity, Inbox, Target, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

import type { SimulationKpis, SparklineData } from '../queries'

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

function Delta({
  value,
  suffix = '%',
  label,
}: {
  value: number
  suffix?: string
  label?: string
}) {
  const up = value >= 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11.5px] font-semibold',
        up ? 'text-success' : 'text-destructive',
      )}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}{label ? ` ${label}` : ''}
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
        featured ? 'border-primary/20 bg-primary/8' : 'border-primary/10 bg-card',
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
          {foot && <span className="text-[10.5px] text-foreground/38">{foot}</span>}
        </div>
        <Spark data={spark} color={sparkColor} />
      </div>
    </div>
  )
}

interface Props {
  kpis: SimulationKpis
  sparklines: SparklineData
}

export function KpiCards({ kpis, sparklines }: Props) {
  return (
    <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
      <KpiCard
        featured
        primaryVal
        label="Simulações (7d)"
        value={kpis.count7d.toLocaleString('pt-BR')}
        icon={<Inbox size={15} />}
        spark={sparklines}
        delta={<Delta value={kpis.countGrowth} />}
        foot="vs sem. anterior"
      />

      <KpiCard
        label="Volume simulado"
        value={brl(kpis.volume30)}
        icon={<Wallet size={15} />}
        spark={sparklines}
        sparkColor="var(--success)"
        delta={<Delta value={kpis.volumeGrowth} />}
      />

      <KpiCard
        label="Score médio"
        value={kpis.scoreMedio.toFixed(1)}
        icon={<Target size={15} />}
        spark={sparklines}
        sparkColor="var(--muted-foreground)"
        delta={<Delta value={2.8} suffix=" pts" />}
      />

      <KpiCard
        label="Taxa de conversão"
        value={`${kpis.convRate.toFixed(1)}%`}
        icon={<Activity size={15} />}
        spark={sparklines}
        sparkColor="var(--destructive)"
        delta={<Delta value={-1.2} suffix="pp" />}
      />
    </div>
  )
}

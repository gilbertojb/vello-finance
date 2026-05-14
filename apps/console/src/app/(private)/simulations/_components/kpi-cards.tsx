import { Activity, Target, TrendingUp, Wallet } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { SimulationKpis, SparklineData } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function GrowthTag({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const pos = value >= 0
  return (
    <span className={`text-xs font-medium ${pos ? 'text-emerald-400' : 'text-red-400'}`}>
      {pos ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

// SVG Sparkline puro — sem Recharts
function Sparkline({ data, positive = true }: { data: number[]; positive?: boolean }) {
  if (data.length < 2) return null
  const w = 80, h = 32
  const max = Math.max(...data, 1)
  const min = Math.min(...data, 0)
  const range = max - min || 1
  const pts = data.map((v, i) =>
    `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h * 0.85 - 2}`
  ).join(' ')
  return (
    <svg width={w} height={h} className="opacity-80" aria-hidden>
      <polyline
        points={pts}
        fill="none"
        stroke={positive ? 'var(--color-primary)' : 'oklch(0.65 0.18 25)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface Props {
  kpis: SimulationKpis
  sparklines: SparklineData
}

export function KpiCards({ kpis, sparklines }: Props) {
  const cards = [
    {
      label: 'SIMULAÇÕES (7D)',
      value: kpis.count7d.toLocaleString('pt-BR'),
      growth: <GrowthTag value={kpis.countGrowth} />,
      sub: 'vs sem. anterior',
      icon: <Activity className="size-4 text-muted-foreground" />,
      spark: sparklines,
      positive: kpis.countGrowth >= 0,
    },
    {
      label: 'VOLUME SIMULADO',
      value: brl(kpis.volume30),
      growth: <GrowthTag value={kpis.volumeGrowth} />,
      sub: '',
      icon: <Wallet className="size-4 text-muted-foreground" />,
      spark: sparklines,
      positive: kpis.volumeGrowth >= 0,
    },
    {
      label: 'SCORE MÉDIO',
      value: kpis.scoreMedio.toFixed(1),
      growth: <GrowthTag value={0} suffix=" pts" />,
      sub: '',
      icon: <Target className="size-4 text-muted-foreground" />,
      spark: sparklines,
      positive: true,
    },
    {
      label: 'TAXA DE CONVERSÃO',
      value: `${kpis.convRate.toFixed(1)}%`,
      growth: <GrowthTag value={-1.2} suffix="pp" />,
      sub: '',
      icon: <TrendingUp className="size-4 text-muted-foreground" />,
      spark: sparklines,
      positive: false,
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="p-5 relative overflow-hidden">
          {/* Label + ícone no topo */}
          <div className="flex items-start justify-between mb-4">
            <p className="text-[9px] font-semibold tracking-[0.12em] uppercase text-muted-foreground leading-tight">
              {card.label}
            </p>
            <span className="text-muted-foreground shrink-0">{card.icon}</span>
          </div>
          {/* Valor grande */}
          <p className="text-3xl font-bold text-primary mb-2">
            {card.value}
          </p>
          {/* Growth + sparkline na base */}
          <div className="flex items-end justify-between gap-2">
            <div className="flex flex-col gap-0.5">
              {card.growth}
              {card.sub && (
                <span className="text-[10px] text-muted-foreground">{card.sub}</span>
              )}
            </div>
            <Sparkline data={card.spark} positive={card.positive} />
          </div>
        </Card>
      ))}
    </div>
  )
}

import { Activity, FileText, TrendingUp, Wallet } from 'lucide-react'

import { Card } from '@/components/ui/card'

import type { DashboardStats } from '../queries'

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(num: number, den: number): string {
  if (den === 0) return '0%'
  return `${Math.round((num / den) * 100)}%`
}

interface Props {
  stats: DashboardStats
}

export function KpiCards({ stats }: Props) {
  const { simulations, proposals } = stats

  const cards = [
    {
      label:    'Simulações',
      value:    simulations.total.toString(),
      sub:      `${simulations.preQualified} pré-qualificados`,
      icon:     <Activity className="size-5" />,
      iconBg:   'bg-primary/10 text-primary',
    },
    {
      label:    'Taxa de conversão',
      value:    pct(simulations.preQualified, simulations.total),
      sub:      'Simulações → Pré-qualificados',
      icon:     <TrendingUp className="size-5" />,
      iconBg:   'bg-emerald-500/10 text-emerald-600',
    },
    {
      label:    'Propostas recebidas',
      value:    proposals.total.toString(),
      sub:      `${proposals.inPipeline} em análise · ${proposals.approved} aprovadas`,
      icon:     <FileText className="size-5" />,
      iconBg:   'bg-primary/10 text-primary',
    },
    {
      label:    'Volume simulado',
      value:    brl(simulations.volumeTotal),
      sub:      `${brl(proposals.volumePipeline)} em análise`,
      icon:     <Wallet className="size-5" />,
      iconBg:   'bg-primary/10 text-primary',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label} className="flex items-start gap-4 p-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${card.iconBg}`}
          >
            {card.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="truncate text-2xl font-bold leading-tight">{card.value}</p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{card.sub}</p>
          </div>
        </Card>
      ))}
    </div>
  )
}

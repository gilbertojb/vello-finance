import { Card } from '@/components/ui/card'

import type { DashboardStats } from '../queries'

interface Props {
  stats: DashboardStats
}

function pct(num: number, den: number): number {
  if (den === 0) return 0
  return Math.round((num / den) * 100)
}

export function ConversionFunnel({ stats }: Props) {
  const { simulations, proposals } = stats
  const base = simulations.total

  const steps = [
    {
      label:       'Simulações',
      description: 'Clientes que realizaram uma simulação',
      count:       simulations.total,
      barPct:      100,
      color:       'bg-primary',
    },
    {
      label:       'Pré-qualificados',
      description: 'Clientes que clicaram em "Quero contratar"',
      count:       simulations.preQualified,
      barPct:      pct(simulations.preQualified, base),
      color:       'bg-primary/75',
    },
    {
      label:       'Propostas enviadas',
      description: 'Clientes que preencheram o formulário completo',
      count:       proposals.total,
      barPct:      pct(proposals.total, base),
      color:       'bg-primary/50',
    },
    {
      label:       'Aprovadas',
      description: 'Propostas com crédito aprovado',
      count:       proposals.approved,
      barPct:      pct(proposals.approved, base),
      color:       'bg-emerald-500',
    },
  ]

  return (
    <Card className="p-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold">Funil de conversão</h2>
        <p className="text-xs text-muted-foreground">Da simulação ao crédito aprovado</p>
      </div>

      <div className="flex flex-col gap-3">
        {steps.map((step, idx) => (
          <div key={step.label} className="flex items-center gap-3">
            {/* Step number */}
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
              {idx + 1}
            </div>

            {/* Label + bar */}
            <div className="flex-1 min-w-0">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-foreground">{step.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{step.description}</span>
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    {step.count.toLocaleString('pt-BR')}
                  </span>
                  <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                    {step.barPct}%
                  </span>
                </div>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${step.color}`}
                  style={{ width: `${step.barPct}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

import { Card } from '@/components/ui/card'

import type { FunnelData } from '../queries'

interface Props {
  data: FunnelData
}

export function ConversionFunnel({ data }: Props) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Funil Completo
        </p>
        <h2 className="font-heading text-xl font-medium">Da simulação ao pago</h2>
        <p className="text-xs text-muted-foreground">Conversão acumulada</p>
      </div>

      <div className="flex flex-col">
        {data.map((step, idx) => (
          <div
            key={step.label}
            className={`flex items-center gap-3 py-2.5 ${
              idx < data.length - 1 ? 'border-b border-border/50' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{step.label}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    {step.count.toLocaleString('pt-BR')}
                  </span>
                  <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
                    {step.percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${step.percentage}%`,
                    background: `linear-gradient(90deg, #F59E0B, #FBBF24)`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {data.every((s) => s.count === 0) && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nenhum dado disponível ainda.
          </p>
        )}
      </div>
    </Card>
  )
}

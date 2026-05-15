import type { FunnelData } from '../queries'

interface Props {
  data: FunnelData
}

export function ConversionFunnel({ data }: Props) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-card p-5">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-foreground/55">
          Funil Completo
        </p>
        <h2 className="text-xl font-medium tracking-tight text-foreground">Da simulação ao pago</h2>
        <p className="text-xs text-foreground/55">Conversão acumulada</p>
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
                <span className="text-xs font-medium text-foreground">{step.label}</span>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                    {step.count.toLocaleString('pt-BR')}
                  </span>
                  <span className="w-8 text-right font-mono text-xs text-foreground/45">
                    {step.percentage}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/6">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${step.percentage}%`, background: 'var(--primary)' }}
                />
              </div>
            </div>
          </div>
        ))}

        {data.every((s) => s.count === 0) && (
          <p className="py-4 text-center text-xs text-foreground/55">
            Nenhum dado disponível ainda.
          </p>
        )}
      </div>
    </div>
  )
}

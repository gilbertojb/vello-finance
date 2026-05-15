import type { PipelineData } from '../queries'

const STATUS_COLORS: Record<string, string> = {
  in_pipeline: 'var(--primary)',
  approved:    'var(--success)',
  rejected:    'var(--destructive)',
  simulation:  'var(--muted-foreground)',
  cancelled:   'var(--muted-foreground)',
}

interface Props {
  data: PipelineData
}

export function PipelineDistribution({ data }: Props) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-card p-5">
      <div className="mb-5">
        <h3 className="mb-0.5 text-sm font-semibold tracking-tight text-foreground">
          Distribuição por status
        </h3>
        <p className="text-xs text-foreground/45">Propostas em cada etapa macro</p>
      </div>
      <div className="flex flex-col gap-3">
        {data.map((item) => {
          const barColor = STATUS_COLORS[item.status] ?? 'var(--muted-foreground)'
          return (
            <div key={item.status}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-foreground/55">{item.label}</span>
                <span className="text-sm font-semibold tabular-nums text-foreground">{item.count}</span>
              </div>
              <div className="h-7 overflow-hidden rounded-md bg-foreground/4">
                <div style={{ height: '100%', borderRadius: 'inherit', width: `${item.percentage}%`, backgroundColor: barColor, transition: 'width 500ms ease' }} />
              </div>
            </div>
          )
        })}
        {data.length === 0 && (
          <p className="py-4 text-center text-xs text-foreground/38">Nenhuma proposta ainda.</p>
        )}
      </div>
    </div>
  )
}

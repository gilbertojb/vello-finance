import type { ProductVolume } from '../queries'

const CHART_TOKENS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  data: ProductVolume
}

export function ProductVolume({ data }: Props) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-card p-5">
      <div className="mb-5">
        <h3 className="mb-0.5 text-sm font-semibold tracking-tight text-foreground">Volume por linha</h3>
        <p className="text-xs text-foreground/45">Top produtos contratados</p>
      </div>
      <div className="flex flex-col gap-3.5">
        {data.map((item, idx) => {
          const color = CHART_TOKENS[idx % CHART_TOKENS.length]!
          return (
            <div key={item.name}>
              <div className="mb-1.5 flex items-center gap-2">
                <span className="inline-block size-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} />
                <span className="flex-1 truncate text-xs text-foreground/70">{item.name}</span>
                <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground">{brl(item.volume)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-foreground/6">
                <div style={{ height: '100%', borderRadius: 'inherit', width: `${item.percentage}%`, backgroundColor: color, transition: 'width 500ms ease' }} />
              </div>
            </div>
          )
        })}
        {data.length === 0 && (
          <p className="py-4 text-center text-xs text-foreground/38">Nenhum produto com propostas ainda.</p>
        )}
      </div>
    </div>
  )
}

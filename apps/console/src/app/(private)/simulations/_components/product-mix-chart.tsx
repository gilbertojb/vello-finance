import type { ProductMixRow } from '../queries'

const CHART_TOKENS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

interface Props {
  data: ProductMixRow[]
}

export function ProductMixChart({ data }: Props) {
  return (
    <div className="rounded-[14px] border border-primary/10 bg-card p-5">
      <h2 className="text-[15px] font-semibold tracking-tight text-foreground">
        Mix por produto
      </h2>
      <p className="mb-5 mt-0.5 text-xs text-foreground/45">Distribuição das simulações</p>

      <div className="flex flex-col gap-3">
        {data.map((item, i) => {
          const color = CHART_TOKENS[i % CHART_TOKENS.length]!
          return (
            <div key={item.name}>
              <div className="mb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[13px] text-foreground/70">{item.name}</span>
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-foreground">
                  {item.pct}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-foreground/6">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import { Card } from '@/components/ui/card'

import type { PipelineData } from '../queries'

interface Props {
  data: PipelineData
}

export function PipelineDistribution({ data }: Props) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Pipeline
        </p>
        <h2 className="font-heading text-xl font-medium">Distribuição por status</h2>
        <p className="text-xs text-muted-foreground">Propostas em cada etapa macro</p>
      </div>

      <div className="flex flex-col gap-3">
        {data.map((item) => (
          <div key={item.status} className="flex items-center gap-3">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium">{item.label}</span>
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {item.count}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        {data.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nenhuma proposta ainda.
          </p>
        )}
      </div>
    </Card>
  )
}

import { Card } from '@/components/ui/card'

import type { ProductVolume } from '../queries'

const PALETTE = [
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#EF4444',
  '#8B5CF6',
  '#F97316',
  '#EC4899',
  '#14B8A6',
]

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  data: ProductVolume
}

export function ProductVolume({ data }: Props) {
  return (
    <Card className="p-5">
      <div className="mb-4">
        <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
          Produtos
        </p>
        <h2 className="font-heading text-xl font-medium">Volume por linha</h2>
        <p className="text-xs text-muted-foreground">Top produtos contratados</p>
      </div>

      <div className="flex flex-col gap-3">
        {data.map((item, idx) => {
          const color = PALETTE[idx % PALETTE.length]!
          return (
            <div key={item.name} className="flex items-center gap-3">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <div className="min-w-0 flex-1">
                <div className="mb-0.5 flex items-center justify-between gap-2">
                  <span className="truncate text-xs font-medium">{item.name}</span>
                  <span className="font-mono text-xs font-semibold tabular-nums">
                    {brl(item.volume)}
                  </span>
                </div>
                <p className="mb-1 text-[10px] text-muted-foreground">
                  {item.count} proposta{item.count !== 1 ? 's' : ''}
                </p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        {data.length === 0 && (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Nenhum produto com propostas ainda.
          </p>
        )}
      </div>
    </Card>
  )
}

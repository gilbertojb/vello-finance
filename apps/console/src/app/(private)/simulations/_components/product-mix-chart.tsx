import { Card } from '@/components/ui/card'
import type { ProductMixRow } from '../queries'

const COLORS = ['#F59E0B','#10B981','#3B82F6','#8B5CF6','#EF4444','#F97316','#14B8A6']

interface Props { data: ProductMixRow[] }

export function ProductMixChart({ data }: Props) {
  return (
    <Card className="p-5">
      <h2 className="font-heading text-lg font-medium">Mix por produto</h2>
      <p className="mb-4 text-xs text-muted-foreground">Distribuição das simulações</p>

      <div className="flex flex-col gap-3">
        {data.map((item, i) => (
          <div key={item.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block size-2 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <span className="text-sm font-semibold tabular-nums">{item.pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted/30">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${item.pct}%`,
                  backgroundColor: COLORS[i % COLORS.length],
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

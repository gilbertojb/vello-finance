import { Card } from '@/components/ui/card'
import type { FunnelRow } from '../queries'

interface Props { data: FunnelRow[] }

export function FunnelChart({ data }: Props) {
  const maxCount = data[0]?.count ?? 1

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="font-heading text-lg font-medium">Funil de conversão</h2>
          <p className="text-xs text-muted-foreground">Últimos 30 dias · jornada do lead</p>
        </div>
        <div className="flex gap-1">
          {['7d','30d','90d'].map(p => (
            <button key={p} className={`rounded px-2 py-1 text-[10px] font-medium transition-colors ${
              p === '30d'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted'
            }`}>{p}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {data.map((row, i) => {
          const width = maxCount > 0 ? Math.round((row.count / maxCount) * 100) : 0
          // Fade do amber para verde conforme avança no funil
          const colors = ['#D4A53B','#C9A04C','#A0B845','#65BD6A','#10B981']
          const color = colors[Math.min(i, colors.length - 1)]
          return (
            <div key={row.label} className="grid grid-cols-[140px_1fr_80px_60px] items-center gap-3">
              <p className="text-xs text-muted-foreground">{row.label}</p>
              <div className="h-6 rounded bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded transition-all"
                  style={{ width: `${width}%`, backgroundColor: color }}
                />
              </div>
              <p className="text-right font-mono text-sm font-medium">
                {row.count.toLocaleString('pt-BR')}
              </p>
              <p className="text-right text-xs text-muted-foreground">
                {row.pct}%
              </p>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

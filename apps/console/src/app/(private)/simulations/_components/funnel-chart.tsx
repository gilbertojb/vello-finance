'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { FunnelRow } from '../queries'

interface Props {
  data: FunnelRow[]
}

function barColor(index: number): string {
  if (index === 0 || index === 1) return 'color-mix(in oklch, var(--primary) 40%, transparent)'
  if (index === 4) return 'var(--success)'
  return 'var(--primary)'
}

const PERIODS = ['7d', '30d', '90d'] as const
type Period = (typeof PERIODS)[number]

export function FunnelChart({ data }: Props) {
  const [activePeriod, setActivePeriod] = useState<Period>('30d')
  const maxCount = Math.max(...data.map((r) => r.count), 1)

  return (
    <div className="rounded-2xl border border-primary/10 bg-card p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold leading-snug text-foreground">Funil de conversão</h2>
          <p className="mt-0.5 text-xs text-foreground/45">Últimos {activePeriod} · jornada do lead</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-primary/10 bg-foreground/4 p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setActivePeriod(p)}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-all',
                activePeriod === p ? 'bg-primary/12 text-primary' : 'bg-transparent text-foreground/55',
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2.5">
        {data.map((row, i) => {
          const width = maxCount > 0 ? Math.round((row.count / maxCount) * 100) : 0
          return (
            <div key={row.label} className="grid items-center gap-3.5" style={{ gridTemplateColumns: '120px 1fr 60px 50px' }}>
              <p className="m-0 text-xs leading-snug text-foreground/55">{row.label}</p>
              <div className="h-7 overflow-hidden rounded-md bg-foreground/4">
                <div style={{ height: '100%', width: `${width}%`, borderRadius: 'inherit', background: barColor(i), transition: 'width .3s ease' }} />
              </div>
              <p className="m-0 text-right font-mono text-sm font-semibold text-foreground">{row.count.toLocaleString('pt-BR')}</p>
              <p className="m-0 text-right text-xs text-foreground/45">{row.pct}%</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TrendData } from '../queries'

interface Props {
  data: TrendData
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid color-mix(in oklch, var(--primary) 15%, transparent)',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <p style={{ marginBottom: 6, color: 'color-mix(in oklch, var(--foreground) 55%, transparent)', fontWeight: 500 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
          <span style={{ color: 'var(--foreground)' }}>
            {entry.name}: <span style={{ fontWeight: 600 }}>{entry.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data }: Props) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-card p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h3 className="mb-0.5 text-sm font-semibold tracking-tight text-foreground">
            Simulações × Propostas
          </h3>
          <p className="text-xs text-foreground/45">Volume diário · Últimos 30 dias</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-foreground/55">
            <span className="inline-block size-2 rounded-full" style={{ background: 'var(--primary)' }} />
            Simulações
          </span>
          <span className="flex items-center gap-1.5 text-xs text-foreground/55">
            <span className="inline-block size-2 rounded-full" style={{ background: 'var(--success)' }} />
            Propostas
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--primary)" strokeOpacity={0.06} vertical={false} />
          <XAxis
            dataKey="label"
            tick={(props) => {
              const { x, y, index, payload } = props as { x: number; y: number; index: number; payload: { value: string } }
              if (index % 5 !== 0) return <g />
              return <text x={x} y={y + 12} textAnchor="middle" fill="color-mix(in oklch, var(--foreground) 30%, transparent)" fontSize={10}>{payload.value}</text>
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fill: 'color-mix(in oklch, var(--foreground) 30%, transparent)', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="simulations" name="Simulações" stroke="var(--primary)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--primary)' }} />
          <Line type="monotone" dataKey="proposals" name="Propostas" stroke="var(--success)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: 'var(--success)' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

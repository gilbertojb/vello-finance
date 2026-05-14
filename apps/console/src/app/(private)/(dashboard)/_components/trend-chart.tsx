'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Card } from '@/components/ui/card'

import type { TrendData } from '../queries'

interface Props {
  data: TrendData
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-xl"
      style={{
        backgroundColor: '#1c1917',
        borderColor: 'rgba(255,255,255,0.1)',
      }}
    >
      <p className="mb-1.5 font-medium text-muted-foreground">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2">
          <span
            className="inline-block size-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-foreground">
            {entry.name}: <span className="font-semibold">{entry.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data }: Props) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Tendência
          </p>
          <h2 className="font-heading text-xl font-medium">Simulações × Propostas</h2>
          <p className="text-xs text-muted-foreground">Volume diário · Últimos 30 dias</p>
        </div>
        <div className="flex shrink-0 items-center gap-4 pt-1">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: '#F59E0B' }}
            />
            <span className="text-xs text-muted-foreground">Simulações</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block size-2 rounded-full"
              style={{ backgroundColor: '#10B981' }}
            />
            <span className="text-xs text-muted-foreground">Propostas</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={(props) => {
              const { x, y, index, payload } = props as {
                x: number
                y: number
                index: number
                payload: { value: string }
              }
              if (index % 5 !== 0) return <g />
              return (
                <text
                  x={x}
                  y={y + 12}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.4)"
                  fontSize={10}
                >
                  {payload.value}
                </text>
              )
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ display: 'none' }}
          />
          <Line
            type="monotone"
            dataKey="simulations"
            name="Simulações"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#F59E0B' }}
          />
          <Line
            type="monotone"
            dataKey="proposals"
            name="Propostas"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#10B981' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}

'use client'

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { TrendData } from '../queries'

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = '#e9c77b'
const GREEN_ACC = '#a8d490'

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
      style={{
        background: '#0e0a08',
        border: '1px solid rgba(233,199,123,.15)',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <p style={{ marginBottom: 6, color: 'rgba(246,239,228,.55)', fontWeight: 500 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: entry.color,
            }}
          />
          <span style={{ color: '#f6efe4' }}>
            {entry.name}: <span style={{ fontWeight: 600 }}>{entry.value}</span>
          </span>
        </div>
      ))}
    </div>
  )
}

export function TrendChart({ data }: Props) {
  return (
    <div
      style={{
        background: 'var(--color-card)',
        border: '1px solid rgba(233,199,123,.10)',
        borderRadius: 14,
        padding: '20px 22px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <div>
          <h3
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: '#f6efe4',
              margin: '0 0 3px',
              letterSpacing: '-.005em',
            }}
          >
            Simulações × Propostas
          </h3>
          <p style={{ fontSize: 12, color: 'rgba(246,239,228,.45)', margin: 0 }}>
            Volume diário · Últimos 30 dias
          </p>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'rgba(246,239,228,.55)',
            }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: '50%', background: GOLD, display: 'inline-block' }}
            />
            Simulações
          </span>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              color: 'rgba(246,239,228,.55)',
            }}
          >
            <span
              style={{ width: 8, height: 8, borderRadius: '50%', background: GREEN_ACC, display: 'inline-block' }}
            />
            Propostas
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(233,199,123,.06)"
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
                  fill="rgba(246,239,228,.3)"
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
            tick={{ fill: 'rgba(246,239,228,.3)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="simulations"
            name="Simulações"
            stroke={GOLD}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: GOLD }}
          />
          <Line
            type="monotone"
            dataKey="proposals"
            name="Propostas"
            stroke={GREEN_ACC}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: GREEN_ACC }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

'use client'

import { useState } from 'react'
import type { FunnelRow } from '../queries'

interface Props { data: FunnelRow[] }

// Estilo de barra por índice (até 5 linhas do DB)
function barStyle(index: number): React.CSSProperties {
  if (index === 0 || index === 1) {
    // dim — faded amber
    return {
      background: 'linear-gradient(90deg,rgba(233,199,123,.3),rgba(233,199,123,.55))',
    }
  }
  if (index === 4) {
    // alt — green
    return {
      background: 'linear-gradient(90deg,#3b5e34,#7baa6c)',
    }
  }
  // amber normal (index 2, 3)
  return {
    background: 'linear-gradient(90deg,#a87f3a,#e9c77b)',
  }
}

const PERIODS = ['7d', '30d', '90d'] as const
type Period = typeof PERIODS[number]

export function FunnelChart({ data }: Props) {
  const [activePeriod, setActivePeriod] = useState<Period>('30d')
  const maxCount = Math.max(...data.map(r => r.count), 1)

  return (
    <div style={{
      background: 'var(--color-card)',
      border: '1px solid rgba(233,199,123,.10)',
      borderRadius: 14,
      padding: 22,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 600, fontSize: 15, color: '#f6efe4', lineHeight: 1.3, margin: 0 }}>
            Funil de conversão
          </h2>
          <p style={{ fontSize: 12, color: 'rgba(246,239,228,.45)', marginTop: 3 }}>
            Últimos {activePeriod} · jornada do lead
          </p>
        </div>

        {/* Period buttons */}
        <div style={{
          display: 'flex',
          gap: 4,
          background: 'rgba(246,239,228,.04)',
          borderRadius: 8,
          padding: 3,
          border: '1px solid rgba(233,199,123,.10)',
        }}>
          {PERIODS.map(p => {
            const isActive = activePeriod === p
            return (
              <button
                key={p}
                onClick={() => setActivePeriod(p)}
                style={{
                  padding: '5px 11px',
                  borderRadius: 6,
                  fontSize: 11.5,
                  fontWeight: 500,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(233,199,123,.12)' : 'transparent',
                  color: isActive ? '#e9c77b' : 'rgba(246,239,228,.55)',
                  transition: 'all .12s',
                }}
              >
                {p}
              </button>
            )
          })}
        </div>
      </div>

      {/* Funnel rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((row, i) => {
          const width = maxCount > 0 ? Math.round((row.count / maxCount) * 100) : 0
          return (
            <div
              key={row.label}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 60px 50px',
                alignItems: 'center',
                gap: 14,
                fontSize: 12.5,
              }}
            >
              <p style={{ color: 'rgba(246,239,228,.55)', fontSize: 12.5, margin: 0, lineHeight: 1.3 }}>
                {row.label}
              </p>
              <div style={{ height: 26, borderRadius: 6, background: 'rgba(246,239,228,.04)', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${width}%`,
                    borderRadius: 6,
                    transition: 'width .3s ease',
                    ...barStyle(i),
                  }}
                />
              </div>
              <p style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#f6efe4', margin: 0 }}>
                {row.count.toLocaleString('pt-BR')}
              </p>
              <p style={{ textAlign: 'right', fontSize: 12, color: 'rgba(246,239,228,.45)', margin: 0 }}>
                {row.pct}%
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

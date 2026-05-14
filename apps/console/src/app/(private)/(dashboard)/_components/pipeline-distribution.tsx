import type { PipelineData } from '../queries'

// ── Design tokens ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  in_pipeline: '#e9c77b',
  approved:    '#5a8a4c',
  rejected:    '#c45947',
  simulation:  '#8b5e3c',
  cancelled:   '#476285',
}

interface Props {
  data: PipelineData
}

export function PipelineDistribution({ data }: Props) {
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
      <div style={{ marginBottom: 20 }}>
        <h3
          style={{
            fontWeight: 600,
            fontSize: 15,
            color: '#f6efe4',
            margin: '0 0 3px',
            letterSpacing: '-.005em',
          }}
        >
          Distribuição por status
        </h3>
        <p style={{ fontSize: 12, color: 'rgba(246,239,228,.45)', margin: 0 }}>
          Propostas em cada etapa macro
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {data.map((item) => {
          const barColor = STATUS_COLORS[item.status] ?? 'rgba(246,239,228,.3)'
          return (
            <div key={item.status}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    color: 'rgba(246,239,228,.55)',
                  }}
                >
                  {item.label}
                </span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: '#f6efe4',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {item.count}
                </span>
              </div>
              <div
                style={{
                  height: 26,
                  borderRadius: 6,
                  background: 'rgba(246,239,228,.04)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 6,
                    width: `${item.percentage}%`,
                    backgroundColor: barColor,
                    transition: 'width 500ms ease',
                  }}
                />
              </div>
            </div>
          )
        })}

        {data.length === 0 && (
          <p
            style={{
              padding: '16px 0',
              textAlign: 'center',
              fontSize: 12,
              color: 'rgba(246,239,228,.38)',
            }}
          >
            Nenhuma proposta ainda.
          </p>
        )}
      </div>
    </div>
  )
}

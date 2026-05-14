import type { ProductVolume } from '../queries'

// ── Design tokens ──────────────────────────────────────────────────────────────
const PALETTE = ['#e9c77b', '#5a8a4c', '#c9a47a', '#8b5e3c', '#c45947', '#a87f3a', '#3b5e34']

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  data: ProductVolume
}

export function ProductVolume({ data }: Props) {
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
          Volume por linha
        </h3>
        <p style={{ fontSize: 12, color: 'rgba(246,239,228,.45)', margin: 0 }}>
          Top produtos contratados
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {data.map((item, idx) => {
          const color = PALETTE[idx % PALETTE.length]!
          return (
            <div key={item.name}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 2,
                    backgroundColor: color,
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <span
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    color: 'rgba(246,239,228,.7)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.name}
                </span>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: '#f6efe4',
                    fontVariantNumeric: 'tabular-nums',
                    flexShrink: 0,
                  }}
                >
                  {brl(item.volume)}
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 3,
                  background: 'rgba(246,239,228,.06)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    borderRadius: 3,
                    width: `${item.percentage}%`,
                    backgroundColor: color,
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
            Nenhum produto com propostas ainda.
          </p>
        )}
      </div>
    </div>
  )
}

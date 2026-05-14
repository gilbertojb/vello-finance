import { Activity, CheckCircle, TrendingUp, Wallet } from 'lucide-react'

import type { DashboardKpis } from '../queries'

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = '#e9c77b'
const GREEN_ACC = '#a8d490'
const RED_ACC = '#e8a092'
const TAN = '#c9a47a'

// ── Helpers ────────────────────────────────────────────────────────────────────
function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function brlM(v: number): string {
  return brl(v)
}

// ── Sparkline ─────────────────────────────────────────────────────────────────
function Spark({ data, color = GOLD }: { data: number[]; color?: string }) {
  if (data.length < 2) return null
  const w = 80, h = 28
  const max = Math.max(...data)
  const min = Math.min(...data)
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w
      const y = h - ((v - min) / (max - min || 1)) * h
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden>
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={color}
        fillOpacity="0.08"
        stroke="none"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Delta ─────────────────────────────────────────────────────────────────────
function Delta({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0
  return (
    <span
      style={{
        color: up ? '#a8d490' : '#e8a092',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontWeight: 600,
        fontSize: 11.5,
      }}
    >
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

// ── KPI Card ───────────────────────────────────────────────────────────────────
interface CardProps {
  label: string
  value: string
  goldVal?: boolean
  featured?: boolean
  icon: React.ReactNode
  spark: number[]
  sparkColor?: string
  delta: React.ReactNode
  foot?: string
}

function KpiCard({
  label,
  value,
  goldVal,
  featured,
  icon,
  spark,
  sparkColor = GOLD,
  delta,
  foot,
}: CardProps) {
  return (
    <div
      style={{
        background: featured
          ? 'linear-gradient(140deg,#1d150f 0%,#0d0a07 80%)'
          : 'var(--color-card)',
        border: `1px solid ${featured ? 'rgba(233,199,123,.2)' : 'rgba(233,199,123,.10)'}`,
        borderRadius: 14,
        padding: '20px 22px',
      }}
    >
      {/* Head */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
        }}
      >
        <span
          style={{
            fontSize: 11,
            letterSpacing: '.18em',
            textTransform: 'uppercase',
            color: 'rgba(246,239,228,.55)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'rgba(233,199,123,.08)',
            color: GOLD,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {icon}
        </span>
      </div>

      {/* Value */}
      <div
        style={{
          fontSize: 30,
          fontWeight: 600,
          letterSpacing: '-.025em',
          lineHeight: 1,
          color: goldVal ? GOLD : '#f6efe4',
        }}
      >
        {value}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 14,
          fontSize: 11.5,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {delta}
          {foot && (
            <span style={{ fontSize: 10.5, color: 'rgba(246,239,228,.38)' }}>{foot}</span>
          )}
        </div>
        <Spark data={spark} color={sparkColor} />
      </div>
    </div>
  )
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  kpis: DashboardKpis
}

export function KpiCards({ kpis }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      }}
    >
      {/* Card 1 — Volume Contratado (featured) */}
      <KpiCard
        featured
        goldVal
        label="Volume Contratado"
        value={brl(kpis.volumeContratado)}
        icon={<Wallet size={15} />}
        spark={[38, 42, 40, 45, 48, 52, 50, 55, 60, 58, 62, 65]}
        sparkColor={GOLD}
        delta={<Delta value={kpis.simsGrowth} />}
        foot={`${kpis.activeProposals} propostas ativas`}
      />

      {/* Card 2 — Simulações (30d) */}
      <KpiCard
        label="Simulações (30d)"
        value={kpis.sims30Count.toLocaleString('pt-BR')}
        icon={<Activity size={15} />}
        spark={[12, 14, 11, 18, 16, 22, 28, 26, 31, 29, 34, 38]}
        sparkColor={GREEN_ACC}
        delta={<Delta value={kpis.simsGrowth} />}
        foot={`${brlM(kpis.sims30Volume)} simulados`}
      />

      {/* Card 3 — Taxa de Conversão */}
      <KpiCard
        label="Taxa de Conversão"
        value={`${kpis.conversionRate.toFixed(1)}%`}
        icon={<TrendingUp size={15} />}
        spark={[8, 9, 10, 9, 10, 11, 10, 11, 12, 11, 12, 12]}
        sparkColor={TAN}
        delta={<Delta value={0.0} />}
        foot="simulação → proposta"
      />

      {/* Card 4 — Desembolsado */}
      <KpiCard
        label="Desembolsado"
        value={brl(kpis.disbursed)}
        icon={<CheckCircle size={15} />}
        spark={[5, 8, 6, 9, 11, 10, 13, 12, 11, 14, 13, 15]}
        sparkColor={RED_ACC}
        delta={<Delta value={kpis.disbursedGrowth} />}
        foot="esta semana"
      />
    </div>
  )
}

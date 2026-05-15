'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  ChevronDown,
  Clock,
  CreditCard,
  Eye,
  FileText,
  LayoutGrid,
  MoreHorizontal,
  Search,
  TrendingUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ProposalRow } from '../queries'

// ── Helpers ───────────────────────────────────────────────────────────────────

function brl(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function brlFull(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function avatarColor(name: string): string {
  const palettes = [
    'bg-chart-1/25 text-chart-1',
    'bg-chart-2/25 text-chart-2',
    'bg-chart-3/25 text-chart-3',
    'bg-chart-4/25 text-chart-4',
    'bg-chart-5/25 text-chart-5',
  ]
  let h = 0
  for (const c of name) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return palettes[Math.abs(h) % palettes.length]
}

const PRODUCT_DOT: Record<string, string> = {
  'FGTS': 'bg-chart-1',
  'Consignado INSS': 'bg-chart-2',
  'Consignado Federal': 'bg-chart-3',
  'Consignado Privado': 'bg-chart-4',
  'Crédito Pessoal': 'bg-chart-5',
  'Home Equity': 'bg-amber-500',
  'Refin Auto': 'bg-orange-500',
}

function productDot(name?: string | null): string {
  return (name && PRODUCT_DOT[name]) ?? 'bg-muted-foreground'
}

function getPriority(amount: number): { label: string; cls: string } {
  if (amount >= 100_000) return { label: 'Alta', cls: 'text-orange-400' }
  if (amount >= 20_000) return { label: 'Média', cls: 'text-yellow-500' }
  return { label: 'Baixa', cls: 'text-foreground/40' }
}

function sinceDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'há 1d'
  return `há ${diff}d`
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<string, { label: string; dotCls: string; textCls: string }> = {
  simulation:  { label: 'Simulação',  dotCls: 'bg-muted-foreground',  textCls: 'text-foreground/55' },
  in_pipeline: { label: 'Em análise', dotCls: 'bg-primary',           textCls: 'text-primary' },
  approved:    { label: 'Pago',       dotCls: 'bg-success',           textCls: 'text-success' },
  rejected:    { label: 'Reprovada',  dotCls: 'bg-destructive',       textCls: 'text-destructive' },
  cancelled:   { label: 'Arquivada',  dotCls: 'bg-muted-foreground',  textCls: 'text-foreground/40' },
}

const STATUS_FILTERS = [
  { label: 'Todos',      value: undefined },
  { label: 'Em análise', value: 'in_pipeline' },
  { label: 'Pago',       value: 'approved' },
  { label: 'Reprovada',  value: 'rejected' },
  { label: 'Arquivada',  value: 'cancelled' },
  { label: 'Simulação',  value: 'simulation' },
] as const

// ── Sub-components ────────────────────────────────────────────────────────────

function Spark({ data, color = 'var(--primary)' }: { data: number[]; color?: string }) {
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
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity="0.08" stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Delta({ value, suffix = '%' }: { value: number; suffix?: string }) {
  const up = value >= 0
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', up ? 'text-success' : 'text-destructive')}>
      {up ? '▲' : '▼'} {Math.abs(value).toFixed(1)}{suffix}
    </span>
  )
}

interface KpiCardProps {
  label: string
  icon: ReactNode
  value: string
  featured?: boolean
  primaryVal?: boolean
  spark: number[]
  sparkColor?: string
  delta: ReactNode
  foot?: string
}

function KpiCard({ label, icon, value, featured, primaryVal, spark, sparkColor = 'var(--primary)', delta, foot }: KpiCardProps) {
  return (
    <div className={cn('rounded-2xl border p-5', featured ? 'border-primary/20 bg-primary/8' : 'border-primary/10 bg-card')}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">{label}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary">{icon}</span>
      </div>
      <div className={cn('text-3xl font-semibold leading-none tracking-tight', primaryVal ? 'text-primary' : 'text-foreground')}>
        {value}
      </div>
      <div className="mt-3.5 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          {delta}
          {foot && <span className="text-xs text-foreground/38">{foot}</span>}
        </div>
        <Spark data={spark} color={sparkColor} />
      </div>
    </div>
  )
}

function ProposalCard({ proposal }: { proposal: ProposalRow }) {
  const product  = Array.isArray(proposal.products) ? proposal.products[0] : proposal.products
  const stage    = Array.isArray(proposal.proposal_stages) ? proposal.proposal_stages[0] : proposal.proposal_stages
  const amount   = Number(proposal.desired_amount)
  const payment  = proposal.estimated_payment ? Number(proposal.estimated_payment) : null
  const rate     = proposal.estimated_rate != null ? Number(proposal.estimated_rate) : null
  const initials = getInitials(proposal.client_name)
  const avCls    = avatarColor(proposal.client_name)
  const priority = getPriority(amount)
  const status   = STATUS_CFG[proposal.status] ?? STATUS_CFG.simulation
  const shortId  = `PROP-${proposal.id.replace(/-/g, '').slice(0, 5).toUpperCase()}`
  const dateStr  = sinceDate(proposal.created_at)
  const stageName = stage?.name ?? status.label

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-primary/10 bg-card p-4 transition-colors hover:border-primary/25">
      {/* ID + priority */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-wide text-foreground/35">{shortId}</span>
        <span className={cn('text-xs font-medium', priority.cls)}>· {priority.label}</span>
      </div>

      {/* Client */}
      <div className="flex items-center gap-3">
        <div className={cn('grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold', avCls)}>
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight text-foreground">
            {proposal.client_name}
          </p>
          <p className="truncate text-xs leading-tight text-foreground/40">
            {proposal.client_email}
          </p>
        </div>
      </div>

      {/* Amount */}
      <div>
        <p className="text-xl font-bold tracking-tight text-foreground">{brlFull(amount)}</p>
        <p className="mt-0.5 text-xs text-foreground/40">
          {proposal.desired_term_months}× {payment ? brlFull(payment) : '—'}
          {rate != null ? ` · ${rate.toFixed(2)}% a.m.` : ''}
        </p>
      </div>

      {/* Product + status tags */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {product?.name && (
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground/55">
            <span className={cn('inline-block size-2.5 rounded-[2px]', productDot(product.name))} />
            {product.name}
          </span>
        )}
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium', status.textCls)}>
          <span className={cn('size-1.5 shrink-0 rounded-full', status.dotCls)} />
          {stageName}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-primary/10 pt-2.5">
        <span className="text-xs text-foreground/35">{dateStr}</span>
        <div className="flex items-center gap-0.5">
          <button type="button" title="Ver detalhes" className="grid size-7 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-foreground/35 hover:text-foreground">
            <Eye size={13} />
          </button>
          <button type="button" title="Mais opções" className="grid size-7 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-foreground/35 hover:text-foreground">
            <MoreHorizontal size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted">
        <FileText className="size-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-base font-medium text-foreground">Nenhuma proposta ainda</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Quando clientes enviarem propostas pela sua loja, elas aparecerão aqui com status e etapa do
        pipeline.
      </p>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────

interface Props {
  proposals: ProposalRow[]
  activeStatus?: string
}

export function ProposalsList({ proposals, activeStatus }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const [activeProduct, setActiveProduct] = useState<string | undefined>(undefined)
  const [search, setSearch] = useState('')

  const stats = useMemo(() => {
    const inProgress = proposals.filter((p) => p.status === 'in_pipeline').length
    const volume = proposals
      .filter((p) => p.status === 'in_pipeline')
      .reduce((s, p) => s + Number(p.desired_amount), 0)
    const atRisk = proposals.filter((p) => {
      if (p.status !== 'in_pipeline') return false
      return (Date.now() - new Date(p.created_at).getTime()) / 86_400_000 > 7
    }).length
    const approveds = proposals.filter((p) => p.status === 'approved')
    const avgDays = approveds.length
      ? approveds.reduce((s, p) => {
          const ref = p.submitted_at ?? p.created_at
          return s + (Date.now() - new Date(ref).getTime()) / 86_400_000
        }, 0) / approveds.length
      : 0
    return { inProgress, volume, atRisk, avgDays: Number(avgDays.toFixed(1)) }
  }, [proposals])

  const productTypes = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of proposals) {
      const prod = Array.isArray(p.products) ? p.products[0] : p.products
      const name = prod?.name ?? 'Sem produto'
      map.set(name, (map.get(name) ?? 0) + 1)
    }
    return Array.from(map.entries())
  }, [proposals])

  const displayed = useMemo(() => {
    return proposals.filter((p) => {
      if (activeStatus && p.status !== activeStatus) return false
      if (activeProduct) {
        const prod = Array.isArray(p.products) ? p.products[0] : p.products
        if (prod?.name !== activeProduct) return false
      }
      if (search) {
        const q = search.toLowerCase()
        if (
          !p.client_name.toLowerCase().includes(q) &&
          !p.client_email.toLowerCase().includes(q) &&
          !p.id.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [proposals, activeStatus, activeProduct, search])

  function setStatusFilter(status: string | undefined) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          featured primaryVal
          label="Em andamento"
          icon={<FileText size={15} />}
          value={stats.inProgress.toLocaleString('pt-BR')}
          spark={[4, 5, 6, 5, 7, 8, 7, 9, 8, 10, 9, 12]}
          delta={<Delta value={12.5} />}
          foot="vs. semana anterior"
        />
        <KpiCard
          label="Volume no pipeline"
          icon={<CreditCard size={15} />}
          value={brl(stats.volume)}
          spark={[40, 45, 42, 48, 50, 55, 52, 58, 60, 62, 65, 70]}
          sparkColor="var(--success)"
          delta={<Delta value={8.3} />}
          foot="últimos 30 dias"
        />
        <KpiCard
          label="SLA em risco"
          icon={<Clock size={15} />}
          value={stats.atRisk.toLocaleString('pt-BR')}
          spark={[2, 1, 3, 2, 4, 3, 5, 4, 3, 4, 3, 2]}
          sparkColor={stats.atRisk > 0 ? 'var(--destructive)' : 'var(--muted-foreground)'}
          delta={<Delta value={stats.atRisk > 0 ? -5.0 : 0} />}
          foot={`${stats.atRisk} vencendo hoje`}
        />
        <KpiCard
          label="Tempo médio"
          icon={<TrendingUp size={15} />}
          value={`${stats.avgDays}d`}
          spark={[12, 11, 13, 12, 11, 10, 11, 10, 9, 10, 9, 8]}
          sparkColor="var(--muted-foreground)"
          delta={<Delta value={-2.1} suffix=" dias" />}
          foot="simulação → pago"
        />
      </div>

      {/* Filtro por tipo de produto */}
      <div className="rounded-2xl border border-primary/10 bg-card px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveProduct(undefined)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
              !activeProduct
                ? 'border border-primary/30 bg-primary/10 text-foreground'
                : 'text-foreground/45 hover:text-foreground',
            )}
          >
            <LayoutGrid size={13} />
            Todos
            <span className={cn('text-xs', !activeProduct ? 'text-foreground/55' : 'text-foreground/30')}>
              {proposals.length}
            </span>
          </button>
          {productTypes.map(([name, count]) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveProduct(activeProduct === name ? undefined : name)}
              className={cn(
                'inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                activeProduct === name
                  ? 'border border-primary/30 bg-primary/10 text-foreground'
                  : 'text-foreground/45 hover:text-foreground',
              )}
            >
              <span className={cn('inline-block size-2.5 rounded-[2px]', productDot(name))} />
              {name}
              <span className={cn('text-xs', activeProduct === name ? 'text-foreground/55' : 'text-foreground/30')}>
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar: status tabs + busca + período */}
      <div className="rounded-2xl border border-primary/10 bg-card px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-1 flex-wrap gap-1 rounded-lg border border-primary/10 bg-foreground/4 p-0.5">
            {STATUS_FILTERS.map((tab) => {
              const count = tab.value
                ? proposals.filter((p) => p.status === tab.value).length
                : proposals.length
              const isActive = activeStatus === tab.value || (!activeStatus && !tab.value)
              return (
                <button
                  key={tab.label}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={cn(
                    'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-transparent text-foreground/55 hover:text-foreground',
                  )}
                >
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-xs font-semibold',
                      isActive
                        ? 'bg-primary-foreground/18 text-primary-foreground'
                        : 'bg-foreground/8',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex min-w-52 items-center gap-2.5 rounded-lg border border-primary/10 bg-foreground/4 px-3.5 py-2">
            <Search className="size-3.5 shrink-0 text-foreground/55" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
            />
          </div>

          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/10 bg-foreground/4 px-3 py-2 text-sm text-foreground"
          >
            <span className="text-foreground/55">Período:</span>
            <b className="font-medium">Últimos 30 dias</b>
            <ChevronDown size={12} className="text-foreground/55" />
          </button>

          <button type="button" className="inline-flex cursor-pointer items-center rounded-lg border border-primary/10 bg-foreground/4 px-3 py-2 text-sm text-foreground/55">
            Mais filtros
          </button>
        </div>
      </div>

      {/* Card grid */}
      {displayed.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {displayed.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  )
}

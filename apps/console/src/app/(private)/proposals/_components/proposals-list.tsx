'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { type DateRange } from 'react-day-picker'
import {
  Clock,
  CreditCard,
  FileText,
  LayoutGrid,
  Search,
  TrendingUp,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import type { ProposalRow } from '../queries'
import { PIPELINE_STATUSES, STATUS_CFG, STATUS_FILTERS } from '../status-config'
import { DateRangePicker } from './date-range-picker'
import { ProposalCard } from './proposal-card'

// ── KPI helpers (internos) ────────────────────────────────────────────────────

function brl(value: number): string {
  if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}k`
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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
  spark: number[]
  sparkColor?: string
  delta: ReactNode
  foot?: string
}

function KpiCard({ label, icon, value, featured, spark, sparkColor = 'var(--primary)', delta, foot }: KpiCardProps) {
  return (
    <Card className={cn('gap-3 py-5', featured && 'ring-primary/30')}>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</span>
          <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary">{icon}</span>
        </div>
        <p className={cn('text-3xl font-semibold leading-none tracking-tight', featured && 'text-primary')}>
          {value}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            {delta}
            {foot && <span className="text-xs text-muted-foreground">{foot}</span>}
          </div>
          <Spark data={spark} color={sparkColor} />
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <Card className="py-14">
      <CardContent className="flex flex-col items-center text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted">
          <FileText className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-medium">Nenhuma proposta encontrada</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Quando clientes enviarem propostas pela sua loja, elas aparecerão aqui com status e etapa
          do pipeline.
        </p>
      </CardContent>
    </Card>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface ProposalsListProps {
  proposals: ProposalRow[]
}

export function ProposalsList({ proposals }: ProposalsListProps) {
  const [activeProduct, setActiveProduct] = useState<string | undefined>()
  const [activeStatus, setActiveStatus] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const stats = useMemo(() => {
    const inPipeline = proposals.filter((p) => PIPELINE_STATUSES.includes(p.status as never))

    const volume = inPipeline.reduce((sum, p) => {
      const sim = Array.isArray(p.simulations) ? p.simulations[0] : p.simulations
      return sum + (sim ? Number(sim.desired_amount) : 0)
    }, 0)

    const atRisk = inPipeline.filter(
      (p) => (Date.now() - new Date(p.created_at).getTime()) / 86_400_000 > 7,
    ).length

    const approved = proposals.filter((p) => p.status === 'aprovada')
    const avgDays  = approved.length
      ? approved.reduce((s, p) => s + (Date.now() - new Date(p.created_at).getTime()) / 86_400_000, 0) / approved.length
      : 0

    return { inProgress: inPipeline.length, volume, atRisk, avgDays: Number(avgDays.toFixed(1)) }
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
    const from = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null
    const to   = dateRange?.to   ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null

    return proposals.filter((p) => {
      if (activeStatus && p.status !== activeStatus) return false

      if (activeProduct) {
        const prod = Array.isArray(p.products) ? p.products[0] : p.products
        if (prod?.name !== activeProduct) return false
      }

      if (from !== null) {
        const created = new Date(p.created_at).getTime()
        if (created < from) return false
        if (to !== null && created > to) return false
      }

      if (search) {
        const q    = search.toLowerCase()
        const sim  = Array.isArray(p.simulations) ? p.simulations[0] : p.simulations
        const name  = (p.client_name ?? sim?.client_name ?? '').toLowerCase()
        const phone = (p.client_phone ?? sim?.client_phone ?? '').toLowerCase()
        if (!name.includes(q) && !phone.includes(q) && !p.id.toLowerCase().includes(q)) return false
      }

      return true
    })
  }, [proposals, activeStatus, activeProduct, dateRange, search])

  return (
    <div className="flex flex-col gap-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          featured
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
          foot="proposta → aprovada"
        />
      </div>

      {/* Filtro por produto */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-center gap-1">
          <Button
            variant={!activeProduct ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => setActiveProduct(undefined)}
          >
            <LayoutGrid size={13} />
            Todos
            <Badge variant="outline" className="text-xs">{proposals.length}</Badge>
          </Button>

          {productTypes.map(([name, count]) => (
            <Button
              key={name}
              variant={activeProduct === name ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => setActiveProduct(activeProduct === name ? undefined : name)}
            >
              {name}
              <Badge variant="outline" className="text-xs">{count}</Badge>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Toolbar: status + busca + período */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-center gap-3">
          {/* Status tabs */}
          <div className="flex flex-1 flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
            {STATUS_FILTERS.map((tab) => {
              const count    = tab.value ? proposals.filter((p) => p.status === tab.value).length : proposals.length
              const isActive = activeStatus === tab.value || (!activeStatus && !tab.value)
              const statusCfg = tab.value ? STATUS_CFG[tab.value] : undefined
              return (
                <Button
                  key={tab.label}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveStatus(isActive ? undefined : tab.value)}
                  className="gap-1.5"
                >
                  {statusCfg && (
                    <span className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      isActive ? 'bg-primary-foreground/70' : `${statusCfg.variant === 'destructive' ? 'bg-destructive' : statusCfg.variant === 'default' ? 'bg-primary' : 'bg-muted-foreground'}`,
                    )} />
                  )}
                  {tab.label}
                  <span className={cn(
                    'rounded-full px-1.5 py-px text-xs font-semibold',
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-foreground/10 text-muted-foreground',
                  )}>
                    {count}
                  </span>
                </Button>
              )
            })}
          </div>

          {/* Busca */}
          <div className="relative min-w-52">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, telefone, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Período */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </CardContent>
      </Card>

      {/* Grid de cards */}
      {displayed.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {displayed.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  )
}

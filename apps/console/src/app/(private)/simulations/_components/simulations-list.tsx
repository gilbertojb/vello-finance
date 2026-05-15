'use client'

import { useState } from 'react'
import { Eye, MoreHorizontal, Phone, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SimulationRow } from '../queries'
import { SimulationDetailSheet } from './simulation-detail-sheet'

const CHART_TOKENS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

function nameToToken(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return CHART_TOKENS[h % CHART_TOKENS.length]!
}

function relativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 1) return 'agora'
  if (m < 60) return `há ${m}min`
  const h = Math.floor(m / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0] ?? '').join('').toUpperCase()
}

function productName(sim: SimulationRow): string {
  const p = sim.products
  if (!p) return '—'
  return Array.isArray(p) ? (p[0]?.name ?? '—') : (p as { name: string }).name
}

function simDisplayId(id: string): string {
  return 'SIM-' + id.replace(/-/g, '').slice(-5).toUpperCase()
}

export function StatusPill({ status }: { status: string }) {
  const MAP: Record<string, { label: string; bg: string; color: string }> = {
    rascunho:        { label: 'Novo lead',   bg: 'color-mix(in oklch, var(--success) 14%, transparent)',     color: 'var(--success)' },
    pre_qualificado: { label: 'Qualificado', bg: 'color-mix(in oklch, var(--primary) 14%, transparent)',     color: 'var(--primary)' },
    em_contato:      { label: 'Em contato',  bg: 'color-mix(in oklch, var(--primary) 10%, transparent)',     color: 'var(--primary)' },
    convertido:      { label: 'Convertido',  bg: 'color-mix(in oklch, var(--success) 18%, transparent)',     color: 'var(--success)' },
    perdido:         { label: 'Perdido',     bg: 'color-mix(in oklch, var(--destructive) 14%, transparent)', color: 'var(--destructive)' },
  }
  const s = MAP[status] ?? MAP['rascunho']!
  return (
    <span
      style={{ background: s.bg, color: s.color }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
    >
      <span className="size-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
    </span>
  )
}

function Checkbox({ checked, onClick }: { checked: boolean; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'grid size-4 shrink-0 cursor-pointer place-items-center rounded',
        checked ? 'bg-primary text-primary-foreground' : 'border-[1.5px] border-foreground/25 bg-transparent text-transparent',
      )}
    >
      {checked && (
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-11" />
        </svg>
      )}
    </span>
  )
}

type Tab = 'all' | 'rascunho' | 'em_contato' | 'pre_qualificado' | 'convertido' | 'perdido'

const TABS: { key: Tab; label: string; statusFilter?: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'rascunho', label: 'Novos', statusFilter: 'rascunho' },
  { key: 'em_contato', label: 'Em contato' },
  { key: 'pre_qualificado', label: 'Qualificados', statusFilter: 'pre_qualificado' },
  { key: 'convertido', label: 'Convertidos' },
  { key: 'perdido', label: 'Perdidos' },
]

const PAGE_SIZE = 15

interface Props {
  simulations: SimulationRow[]
}

export function SimulationsList({ simulations }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [detailSim, setDetailSim] = useState<SimulationRow | null>(null)

  const counts: Record<Tab, number> = {
    all: simulations.length,
    rascunho: simulations.filter((s) => s.status === 'rascunho').length,
    em_contato: 0,
    pre_qualificado: simulations.filter((s) => s.status === 'pre_qualificado').length,
    convertido: 0,
    perdido: 0,
  }

  const tabFilter = TABS.find((t) => t.key === activeTab)?.statusFilter
  let displayed = tabFilter ? simulations.filter((s) => s.status === tabFilter) : activeTab === 'all' ? simulations : []

  if (search.trim()) {
    const q = search.toLowerCase()
    displayed = displayed.filter(
      (s) => s.client_name.toLowerCase().includes(q) || (s.client_email ?? '').toLowerCase().includes(q) || simDisplayId(s.id).toLowerCase().includes(q),
    )
  }

  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
  const pageData = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  function toggleAll() {
    setSelected(selected.size === pageData.length ? new Set() : new Set(pageData.map((s) => s.id)))
  }

  function handleTabChange(tab: Tab) { setActiveTab(tab); setPage(1); setSelected(new Set()) }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-primary/10 bg-card px-4 py-3.5">
        {/* Segmented tabs */}
        <div className="flex rounded-lg border border-primary/10 bg-foreground/4 p-0.5">
          {TABS.map((tab) => {
            const count = counts[tab.key]
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-md px-3.5 py-1.5 text-sm font-medium transition-all',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-transparent text-foreground/55',
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn('rounded-full px-1.5 py-px text-xs font-semibold', isActive ? 'bg-primary-foreground/18 text-primary-foreground' : 'bg-foreground/8')}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="flex min-w-60 flex-1 items-center gap-2.5 rounded-lg border border-primary/10 bg-foreground/4 px-3.5 py-2">
          <Search className="size-3.5 shrink-0 text-foreground/55" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nome, CPF, ID…"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground/40"
          />
        </div>

        {/* Filters */}
        <button type="button" className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/10 bg-foreground/4 px-3 py-2 text-sm text-foreground">
          <span className="text-foreground/55">Período:</span>
          <b>Últimos 30d</b>
          <span className="text-xs">▾</span>
        </button>
        <button type="button" className="inline-flex cursor-pointer items-center rounded-lg border border-primary/10 bg-foreground/4 px-3 py-2 text-sm text-foreground/55">
          Mais filtros
        </button>
      </div>

      {/* Tabela */}
      <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="w-11 border-b border-primary/10 bg-foreground/2 p-4 text-left text-xs font-medium uppercase tracking-widest text-foreground/55">
                  <Checkbox checked={selected.size === pageData.length && pageData.length > 0} onClick={() => toggleAll()} />
                </th>
                {['ID', 'LEAD', 'PRODUTO', 'VALOR / CONDIÇÕES', 'STATUS', 'ORIGEM', 'RECEBIDA', ''].map((h) => (
                  <th key={h} className="whitespace-nowrap border-b border-primary/10 bg-foreground/2 p-4 text-left text-xs font-medium uppercase tracking-widest text-foreground/55">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 px-4 text-center text-sm text-foreground/40">
                    Nenhuma simulação encontrada.
                  </td>
                </tr>
              ) : pageData.map((sim, idx) => {
                const pName = productName(sim)
                const isLast = idx === pageData.length - 1
                const token = nameToToken(sim.client_name)
                return (
                  <tr key={sim.id} className="transition-colors hover:bg-foreground/[2.5%]">
                    <td className={cn('p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <Checkbox checked={selected.has(sim.id)} onClick={(e) => { e.stopPropagation(); toggleSelect(sim.id) }} />
                    </td>
                    <td className={cn('p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <span className="font-mono text-xs text-foreground/55">{simDisplayId(sim.id)}</span>
                    </td>
                    <td className={cn('p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <div className="flex items-center gap-3">
                        <div className="grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold" style={{ background: `color-mix(in oklch, ${token} 20%, var(--card))`, color: token }}>
                          {initials(sim.client_name)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold tracking-tight text-foreground">{sim.client_name}</div>
                          {sim.client_email && <div className="mt-px text-xs text-foreground/55">{sim.client_email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={cn('p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
                        <span className="size-2 shrink-0 rounded-sm" style={{ background: nameToToken(pName) }} />
                        {pName}
                      </span>
                    </td>
                    <td className={cn('p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <div className="text-sm font-semibold tracking-tight text-foreground">
                        {Number(sim.desired_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <div className="mt-0.5 text-xs text-foreground/55">
                        {sim.desired_term_months}m · {sim.estimated_rate ? `${Number(sim.estimated_rate).toFixed(2)}% a.m.` : '—'}
                      </div>
                    </td>
                    <td className={cn('p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <StatusPill status={sim.status} />
                    </td>
                    <td className={cn('p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <span className="text-xs text-foreground/55">Landing · Simulador</span>
                    </td>
                    <td className={cn('whitespace-nowrap p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <span className="text-xs text-foreground/55">{relativeTime(sim.created_at)}</span>
                    </td>
                    <td className={cn('p-4 align-middle', !isLast && 'border-b border-primary/8')}>
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setDetailSim(sim)} title="Ver detalhes" className="grid size-8 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-foreground/40 hover:text-foreground">
                          <Eye size={14} />
                        </button>
                        <a href={`tel:${sim.client_phone}`} title="Ligar" className="grid size-8 place-items-center rounded-lg text-foreground/40 no-underline hover:text-foreground">
                          <Phone size={14} />
                        </a>
                        <button type="button" title="Mais opções" className="grid size-8 cursor-pointer place-items-center rounded-lg border-none bg-transparent text-foreground/40 hover:text-foreground">
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-primary/10 bg-foreground/2 px-4 py-4 text-xs text-foreground/55">
          <span>
            Mostrando <span className="font-medium text-foreground">{pageData.length}</span> de <span className="font-medium text-foreground">{displayed.length}</span> simulações
          </span>
          <div className="flex items-center gap-0.5">
            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="grid size-8 place-items-center rounded-lg text-xs font-medium text-foreground/55 transition-opacity disabled:opacity-30">←</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              const isActive = page === p
              return (
                <button key={p} type="button" onClick={() => setPage(p)} className={cn('grid size-8 place-items-center rounded-lg text-xs transition-all', isActive ? 'bg-primary font-semibold text-primary-foreground' : 'font-medium text-foreground/55')}>
                  {p}
                </button>
              )
            })}
            {totalPages > 5 && (
              <>
                <span className="px-0.5 text-foreground/40">…</span>
                <button type="button" onClick={() => setPage(totalPages)} className="grid size-8 place-items-center rounded-lg text-xs font-medium text-foreground/55">{totalPages}</button>
              </>
            )}
            <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="grid size-8 place-items-center rounded-lg text-xs font-medium text-foreground/55 transition-opacity disabled:opacity-30">→</button>
          </div>
        </div>
      </div>

      <SimulationDetailSheet simulation={detailSim} onClose={() => setDetailSim(null)} />
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Eye, Phone, MoreHorizontal, Search } from 'lucide-react'
import { Card } from '@/components/ui/card'
import type { SimulationRow } from '../queries'
import { SimulationDetailSheet } from './simulation-detail-sheet'

// ── Utilitários ──────────────────────────────────────────────────────────────
function brl(v: number | null): string {
  if (!v) return '—'
  return Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
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
  return name.split(' ').slice(0, 2).map(n => n[0] ?? '').join('').toUpperCase()
}

function productName(sim: SimulationRow): string {
  const p = sim.products
  if (!p) return '—'
  return Array.isArray(p) ? (p[0]?.name ?? '—') : (p as { name: string }).name
}

const AVATAR_COLORS = [
  'bg-emerald-700 text-emerald-100',
  'bg-blue-700 text-blue-100',
  'bg-violet-700 text-violet-100',
  'bg-amber-700 text-amber-100',
  'bg-rose-700 text-rose-100',
  'bg-teal-700 text-teal-100',
]
function avatarColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

const PRODUCT_COLORS = ['#F59E0B','#10B981','#3B82F6','#8B5CF6','#EF4444','#F97316','#14B8A6']
function productDotColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PRODUCT_COLORS[h % PRODUCT_COLORS.length]
}

function simDisplayId(id: string): string {
  return 'SIM-' + id.replace(/-/g, '').slice(-5).toUpperCase()
}

// ── Tipos de aba ──────────────────────────────────────────────────────────────
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

  // Contagens por aba
  const counts: Record<Tab, number> = {
    all: simulations.length,
    rascunho: simulations.filter(s => s.status === 'rascunho').length,
    em_contato: 0,
    pre_qualificado: simulations.filter(s => s.status === 'pre_qualificado').length,
    convertido: 0,
    perdido: 0,
  }

  // Filtragem
  const tabFilter = TABS.find(t => t.key === activeTab)?.statusFilter
  let displayed = tabFilter
    ? simulations.filter(s => s.status === tabFilter)
    : activeTab === 'all'
      ? simulations
      : []

  if (search.trim()) {
    const q = search.toLowerCase()
    displayed = displayed.filter(s =>
      s.client_name.toLowerCase().includes(q) ||
      (s.client_email ?? '').toLowerCase().includes(q) ||
      simDisplayId(s.id).toLowerCase().includes(q)
    )
  }

  // Paginação
  const totalPages = Math.max(1, Math.ceil(displayed.length / PAGE_SIZE))
  const pageData = displayed.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === pageData.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(pageData.map(s => s.id)))
    }
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    setPage(1)
    setSelected(new Set())
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filtros de aba + search + período */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1">
          {TABS.map(tab => {
            const count = counts[tab.key]
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${
                    isActive ? 'bg-black/20 text-white' : 'bg-background text-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground w-56">
            <Search className="size-3.5 shrink-0" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nome, CPF, ID..."
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground text-foreground text-xs"
            />
          </div>
          {/* Período */}
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Período: <span className="text-foreground font-medium">Últimos 30d</span>
            <span className="text-[10px]">▾</span>
          </button>
          <button className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            Mais filtros
          </button>
        </div>
      </div>

      {/* Tabela */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={selected.size === pageData.length && pageData.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                {['ID','LEAD','PRODUTO','VALOR / CONDIÇÕES','STATUS','ORIGEM','RECEBIDA',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold tracking-wider uppercase text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma simulação encontrada.
                  </td>
                </tr>
              ) : pageData.map(sim => {
                const pName = productName(sim)
                const dotColor = productDotColor(pName)
                const isPreQ = sim.status === 'pre_qualificado'
                return (
                  <tr
                    key={sim.id}
                    className="border-b border-border/40 hover:bg-muted/20 transition-colors last:border-0"
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        className="rounded border-border"
                        checked={selected.has(sim.id)}
                        onChange={() => toggleSelect(sim.id)}
                      />
                    </td>
                    {/* ID */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono text-xs text-primary font-medium">
                        {simDisplayId(sim.id)}
                      </span>
                    </td>
                    {/* Lead */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(sim.client_name)}`}>
                          {initials(sim.client_name)}
                        </div>
                        <div>
                          <p className="font-medium text-sm leading-tight">{sim.client_name}</p>
                          {sim.client_email && (
                            <p className="text-[11px] text-muted-foreground leading-tight">{sim.client_email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    {/* Produto */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-block size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: dotColor }}
                        />
                        <span className="text-sm whitespace-nowrap">{pName}</span>
                      </div>
                    </td>
                    {/* Valor / Condições */}
                    <td className="px-4 py-3.5">
                      <p className="font-mono font-medium text-sm">
                        {Number(sim.desired_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {sim.desired_term_months}m · {sim.estimated_rate ? `${Number(sim.estimated_rate).toFixed(2)}% a.m.` : '—'}
                      </p>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`size-2 rounded-full shrink-0 ${isPreQ ? 'bg-emerald-400' : 'bg-primary'}`}
                        />
                        <span className="text-xs font-medium">
                          {isPreQ ? 'Qualificado' : 'Novo'}
                        </span>
                      </div>
                    </td>
                    {/* Origem */}
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      Landing · Simulador
                    </td>
                    {/* Recebida */}
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {relativeTime(sim.created_at)}
                    </td>
                    {/* Ações */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <button
                          onClick={() => setDetailSim(sim)}
                          className="hover:text-foreground transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <a
                          href={`tel:${sim.client_phone}`}
                          className="hover:text-foreground transition-colors"
                          title="Ligar"
                        >
                          <Phone className="size-3.5" />
                        </a>
                        <button className="hover:text-foreground transition-colors" title="Mais opções">
                          <MoreHorizontal className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex items-center justify-between border-t border-border px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Mostrando <span className="font-medium text-foreground">{pageData.length}</span> de{' '}
            <span className="font-medium text-foreground">{displayed.length}</span> simulações
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex size-7 items-center justify-center rounded text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`flex size-7 items-center justify-center rounded text-xs font-medium transition-colors ${
                    page === p
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            {totalPages > 5 && (
              <>
                <span className="text-xs text-muted-foreground px-1">…</span>
                <button
                  onClick={() => setPage(totalPages)}
                  className="flex size-7 items-center justify-center rounded text-xs text-muted-foreground hover:bg-muted"
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex size-7 items-center justify-center rounded text-xs text-muted-foreground hover:bg-muted disabled:opacity-30"
            >
              →
            </button>
          </div>
        </div>
      </Card>

      {/* Sheet de detalhes */}
      <SimulationDetailSheet simulation={detailSim} onClose={() => setDetailSim(null)} />
    </div>
  )
}

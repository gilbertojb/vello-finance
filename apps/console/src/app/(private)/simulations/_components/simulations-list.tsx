'use client'

import { useState } from 'react'
import { Eye, Phone, MoreHorizontal, Search } from 'lucide-react'
import type { SimulationRow } from '../queries'
import { SimulationDetailSheet } from './simulation-detail-sheet'

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = '#e9c77b'
const BROWN_DEEP = '#3b2418'

// ── Avatar gradient ───────────────────────────────────────────────────────────
const AVATAR_PAIRS: [string, string][] = [
  ['#3b2418', '#8b5e3c'],
  ['#5a1d10', '#c45947'],
  ['#1a3a2e', '#5a8a4c'],
  ['#2d2418', '#a87f3a'],
  ['#3b1a18', '#8b5e3c'],
  ['#1d2638', '#476285'],
  ['#3b2820', '#c9a47a'],
]
function avatarGradient(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  const pair = AVATAR_PAIRS[h % AVATAR_PAIRS.length]!
  return `linear-gradient(135deg,${pair[0]},${pair[1]})`
}

// ── Product colors ────────────────────────────────────────────────────────────
const PRODUCT_COLORS = ['#e9c77b', '#5a8a4c', '#c9a47a', '#8b5e3c', '#c45947', '#a87f3a', '#3b5e34']
function productDotColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PRODUCT_COLORS[h % PRODUCT_COLORS.length]!
}

// ── Utilitários ───────────────────────────────────────────────────────────────
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

function simDisplayId(id: string): string {
  return 'SIM-' + id.replace(/-/g, '').slice(-5).toUpperCase()
}

// ── StatusPill ────────────────────────────────────────────────────────────────
export function StatusPill({ status }: { status: string }) {
  const MAP: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    rascunho:        { label: 'Novo lead',   bg: 'rgba(90,138,76,.14)',   color: '#a8d490', dot: '#5a8a4c' },
    pre_qualificado: { label: 'Qualificado', bg: 'rgba(180,130,60,.14)',  color: '#e0a76b', dot: '#c98e3f' },
    em_contato:      { label: 'Em contato',  bg: 'rgba(233,199,123,.10)', color: '#e9c77b', dot: '#e9c77b' },
    convertido:      { label: 'Convertido',  bg: 'rgba(74,140,90,.18)',   color: '#9bd2a8', dot: '#5fa86c' },
    perdido:         { label: 'Perdido',     bg: 'rgba(196,89,71,.14)',   color: '#e8a092', dot: '#c45947' },
  }
  const s = MAP[status] ?? MAP['rascunho']!
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      fontSize: 11.5, fontWeight: 600, padding: '5px 11px',
      borderRadius: 999, letterSpacing: '.02em',
      background: s.bg, color: s.color,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot }} />
      {s.label}
    </span>
  )
}

// ── Checkbox customizado ───────────────────────────────────────────────────────
function Checkbox({ checked, onClick }: { checked: boolean; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        border: checked ? 'none' : '1.5px solid rgba(246,239,228,.25)',
        background: checked ? GOLD : 'transparent',
        color: checked ? BROWN_DEEP : 'transparent',
        display: 'grid', placeItems: 'center', cursor: 'pointer',
      }}
    >
      {checked && (
        <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12l5 5 9-11" />
        </svg>
      )}
    </span>
  )
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
      {/* Toolbar */}
      <div style={{
        background: 'var(--color-card)',
        border: '1px solid rgba(233,199,123,.10)',
        borderRadius: 14,
        padding: '14px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap' as const,
        marginBottom: 16,
      }}>
        {/* Segmented control */}
        <div style={{
          display: 'flex',
          background: 'rgba(246,239,228,.04)',
          border: '1px solid rgba(233,199,123,.10)',
          borderRadius: 9,
          padding: 3,
        }}>
          {TABS.map(tab => {
            const count = counts[tab.key]
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  fontSize: 12.5,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  transition: 'all .12s',
                  background: isActive ? GOLD : 'transparent',
                  color: isActive ? BROWN_DEEP : 'rgba(246,239,228,.55)',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                {tab.label}
                {count > 0 && (
                  <span style={{
                    fontSize: 10.5,
                    background: isActive ? 'rgba(13,10,7,.18)' : 'rgba(246,239,228,.08)',
                    padding: '1px 6px',
                    borderRadius: 999,
                    fontWeight: 600,
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div style={{
          flex: 1,
          minWidth: 240,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'rgba(246,239,228,.04)',
          border: '1px solid rgba(233,199,123,.10)',
          borderRadius: 9,
          padding: '8px 14px',
        }}>
          <Search className="size-3.5 shrink-0" style={{ color: 'rgba(246,239,228,.55)' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Buscar por nome, CPF, ID…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f6efe4', fontSize: 13 }}
          />
        </div>

        {/* Dropdowns */}
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(246,239,228,.04)',
          border: '1px solid rgba(233,199,123,.10)',
          borderRadius: 9, padding: '8px 12px', fontSize: 12.5, color: '#f6efe4', cursor: 'pointer',
        }}>
          <span style={{ color: 'rgba(246,239,228,.55)' }}>Período:</span>
          <b>Últimos 30d</b>
          <span style={{ fontSize: 10 }}>▾</span>
        </button>
        <button style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(246,239,228,.04)',
          border: '1px solid rgba(233,199,123,.10)',
          borderRadius: 9, padding: '8px 12px', fontSize: 12.5, color: 'rgba(246,239,228,.55)', cursor: 'pointer',
        }}>
          Mais filtros
        </button>
      </div>

      {/* Tabela — sem Card shadcn */}
      <div style={{
        background: 'var(--color-card)',
        border: '1px solid rgba(233,199,123,.10)',
        borderRadius: 14,
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {/* Checkbox header */}
                <th style={{
                  fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase' as const,
                  color: 'rgba(246,239,228,.55)', fontWeight: 500, padding: '14px 18px',
                  textAlign: 'left' as const, background: 'rgba(246,239,228,.02)',
                  borderBottom: '1px solid rgba(233,199,123,.10)', width: 46,
                }}>
                  <Checkbox
                    checked={selected.size === pageData.length && pageData.length > 0}
                    onClick={() => toggleAll()}
                  />
                </th>
                {['ID', 'LEAD', 'PRODUTO', 'VALOR / CONDIÇÕES', 'STATUS', 'ORIGEM', 'RECEBIDA', ''].map(h => (
                  <th key={h} style={{
                    fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase' as const,
                    color: 'rgba(246,239,228,.55)', fontWeight: 500, padding: '14px 18px',
                    textAlign: 'left' as const, background: 'rgba(246,239,228,.02)',
                    borderBottom: '1px solid rgba(233,199,123,.10)', whiteSpace: 'nowrap' as const,
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{
                    padding: '48px 18px', textAlign: 'center' as const,
                    fontSize: 13.5, color: 'rgba(246,239,228,.4)',
                  }}>
                    Nenhuma simulação encontrada.
                  </td>
                </tr>
              ) : pageData.map((sim, idx) => {
                const pName = productName(sim)
                const isLast = idx === pageData.length - 1
                return (
                  <tr
                    key={sim.id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(246,239,228,.025)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    style={{ transition: 'background .1s' }}
                  >
                    {/* Checkbox */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                    }}>
                      <Checkbox
                        checked={selected.has(sim.id)}
                        onClick={e => { e.stopPropagation(); toggleSelect(sim.id) }}
                      />
                    </td>

                    {/* ID */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                    }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(246,239,228,.55)' }}>
                        {simDisplayId(sim.id)}
                      </span>
                    </td>

                    {/* Lead */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          display: 'grid', placeItems: 'center',
                          fontSize: 13, fontWeight: 600, color: '#f0d9b5',
                          background: avatarGradient(sim.client_name),
                        }}>
                          {initials(sim.client_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13.5, letterSpacing: '-.005em' }}>{sim.client_name}</div>
                          {sim.client_email && (
                            <div style={{ fontSize: 11.5, color: 'rgba(246,239,228,.55)', marginTop: 1 }}>{sim.client_email}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Produto */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                    }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: '#f6efe4' }}>
                        <span style={{ width: 7, height: 7, borderRadius: 2, background: productDotColor(pName), flexShrink: 0 }} />
                        {pName}
                      </span>
                    </td>

                    {/* Valor / Condições */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-.01em' }}>
                          {Number(sim.desired_amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div style={{ fontSize: 11.5, color: 'rgba(246,239,228,.55)', marginTop: 2, fontWeight: 400 }}>
                          {sim.desired_term_months}m · {sim.estimated_rate ? `${Number(sim.estimated_rate).toFixed(2)}% a.m.` : '—'}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                    }}>
                      <StatusPill status={sim.status} />
                    </td>

                    {/* Origem */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                    }}>
                      <span style={{ color: 'rgba(246,239,228,.55)', fontSize: 12.5 }}>Landing · Simulador</span>
                    </td>

                    {/* Recebida */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                      whiteSpace: 'nowrap' as const,
                    }}>
                      <span style={{ color: 'rgba(246,239,228,.55)', fontSize: 12.5 }}>{relativeTime(sim.created_at)}</span>
                    </td>

                    {/* Ações */}
                    <td style={{
                      padding: '18px', verticalAlign: 'middle' as const,
                      borderBottom: isLast ? 'none' : '1px solid rgba(233,199,123,.08)',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          onClick={() => setDetailSim(sim)}
                          title="Ver detalhes"
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            color: 'rgba(246,239,228,.4)',
                            display: 'grid', placeItems: 'center',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                          }}
                        >
                          <Eye size={14} />
                        </button>
                        <a
                          href={`tel:${sim.client_phone}`}
                          title="Ligar"
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            color: 'rgba(246,239,228,.4)',
                            display: 'grid', placeItems: 'center',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                            textDecoration: 'none',
                          }}
                        >
                          <Phone size={14} />
                        </a>
                        <button
                          title="Mais opções"
                          style={{
                            width: 30, height: 30, borderRadius: 7,
                            color: 'rgba(246,239,228,.4)',
                            display: 'grid', placeItems: 'center',
                            background: 'transparent', border: 'none', cursor: 'pointer',
                          }}
                        >
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

        {/* Pagination footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 18px', background: 'rgba(246,239,228,.02)',
          borderTop: '1px solid rgba(233,199,123,.10)', fontSize: 12.5, color: 'rgba(246,239,228,.55)',
        }}>
          <span>
            Mostrando{' '}
            <span style={{ color: '#f6efe4', fontWeight: 500 }}>{pageData.length}</span>
            {' '}de{' '}
            <span style={{ color: '#f6efe4', fontWeight: 500 }}>{displayed.length}</span>
            {' '}simulações
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                width: 30, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 500,
                background: 'transparent', color: 'rgba(246,239,228,.55)',
                border: '1px solid transparent', cursor: page === 1 ? 'default' : 'pointer',
                opacity: page === 1 ? 0.3 : 1, display: 'grid', placeItems: 'center',
              }}
            >
              ←
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const p = i + 1
              const isActive = page === p
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 30, height: 30, borderRadius: 7, fontSize: 12,
                    fontWeight: isActive ? 600 : 500,
                    background: isActive ? GOLD : 'transparent',
                    color: isActive ? BROWN_DEEP : 'rgba(246,239,228,.55)',
                    border: isActive ? 'none' : '1px solid transparent',
                    cursor: 'pointer', display: 'grid', placeItems: 'center',
                  }}
                >
                  {p}
                </button>
              )
            })}
            {totalPages > 5 && (
              <>
                <span style={{ fontSize: 12, color: 'rgba(246,239,228,.4)', padding: '0 2px' }}>…</span>
                <button
                  onClick={() => setPage(totalPages)}
                  style={{
                    width: 30, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 500,
                    background: 'transparent', color: 'rgba(246,239,228,.55)',
                    border: '1px solid transparent', cursor: 'pointer', display: 'grid', placeItems: 'center',
                  }}
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                width: 30, height: 30, borderRadius: 7, fontSize: 12, fontWeight: 500,
                background: 'transparent', color: 'rgba(246,239,228,.55)',
                border: '1px solid transparent', cursor: page === totalPages ? 'default' : 'pointer',
                opacity: page === totalPages ? 0.3 : 1, display: 'grid', placeItems: 'center',
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* Sheet de detalhes */}
      <SimulationDetailSheet simulation={detailSim} onClose={() => setDetailSim(null)} />
    </div>
  )
}

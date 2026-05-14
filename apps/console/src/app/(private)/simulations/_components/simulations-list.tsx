'use client'

import { useState } from 'react'
import { ClipboardList, Eye, TrendingUp, Wallet } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

import type { SimulationRow } from '../queries'
import { SimulationDetailSheet } from './simulation-detail-sheet'

// ─── Utilitários ─────────────────────────────────────────────────────────────

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `há ${hrs}h`
  return `há ${Math.floor(hrs / 24)}d`
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function productName(sim: SimulationRow): string {
  const p = sim.products
  if (!p) return '—'
  return Array.isArray(p) ? (p[0]?.name ?? '—') : (p as { name: string }).name
}

const PRODUCT_COLORS = [
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#8B5CF6',
  '#EF4444',
  '#F97316',
  '#EC4899',
  '#14B8A6',
]

function productDotColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = ((h * 31 + name.charCodeAt(i)) >>> 0)
  return PRODUCT_COLORS[h % PRODUCT_COLORS.length]
}

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Tab = 'all' | 'pre_qualificado' | 'rascunho'

interface Props {
  simulations: SimulationRow[]
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function SimulationsList({ simulations }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [selectedSim, setSelectedSim] = useState<SimulationRow | null>(null)

  const total = simulations.length
  const preQualified = simulations.filter((s) => s.status === 'pre_qualificado').length
  const notQualified = simulations.filter((s) => s.status === 'rascunho').length
  const totalVolume = simulations.reduce((sum, s) => sum + Number(s.desired_amount), 0)

  const displayed =
    activeTab === 'all' ? simulations : simulations.filter((s) => s.status === activeTab)

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ClipboardList className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de simulações</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pré-qualificados</p>
            <p className="text-2xl font-bold">{preQualified}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wallet className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume simulado</p>
            <p className="truncate text-2xl font-bold">{brl(totalVolume)}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { label: `Todas (${total})`, value: 'all' },
            { label: `Pré-qualificados (${preQualified})`, value: 'pre_qualificado' },
            { label: `Não qualificados (${notQualified})`, value: 'rascunho' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab.value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {displayed.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Lead</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                    Valor / Condições
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Recebida</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((sim) => {
                  const name = productName(sim)
                  const dotColor = name !== '—' ? productDotColor(name) : '#94a3b8'

                  return (
                    <tr
                      key={sim.id}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                    >
                      {/* Lead */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {initials(sim.client_name)}
                          </div>
                          <div>
                            <p className="font-medium">{sim.client_name}</p>
                            {(sim as { client_email?: string | null }).client_email && (
                              <p className="text-xs text-muted-foreground">
                                {(sim as { client_email?: string | null }).client_email}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Produto */}
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span
                            className="mr-2 inline-block size-2 rounded-full"
                            style={{ backgroundColor: dotColor }}
                          />
                          {name}
                        </div>
                      </td>

                      {/* Valor / Condições */}
                      <td className="px-4 py-3">
                        <p className="font-mono font-medium">
                          {brl(Number(sim.desired_amount))}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sim.desired_term_months}m ·{' '}
                          {sim.estimated_rate != null
                            ? `${Number(sim.estimated_rate).toFixed(2)}% a.m.`
                            : '—'}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {sim.status === 'pre_qualificado' ? (
                          <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">
                            Pré-qualificado
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Não qualificado</Badge>
                        )}
                      </td>

                      {/* Recebida */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {relativeTime(sim.created_at)}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setSelectedSim(sim)}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                          aria-label="Ver detalhes"
                        >
                          <Eye className="size-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <SimulationDetailSheet simulation={selectedSim} onClose={() => setSelectedSim(null)} />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ClipboardList className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma simulação ainda</h3>
      <p className="mt-2 max-w-[380px] text-sm text-muted-foreground">
        Quando clientes realizarem simulações na sua loja, elas aparecerão aqui com status e dados
        completos.
      </p>
    </div>
  )
}

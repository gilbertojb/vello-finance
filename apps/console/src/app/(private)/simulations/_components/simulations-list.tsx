'use client'

import { ClipboardList, TrendingUp, Wallet } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

import type { SimulationRow } from '../queries'

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'pre_qualificado') {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">
        Pré-qualificado
      </Badge>
    )
  }
  return <Badge variant="secondary">Simulação</Badge>
}

const STATUS_FILTERS = [
  { label: 'Todas', value: undefined },
  { label: 'Simulações', value: 'rascunho' },
  { label: 'Pré-qualificados', value: 'pre_qualificado' },
] as const

interface Props {
  simulations: SimulationRow[]
  activeStatus?: string
}

export function SimulationsList({ simulations, activeStatus }: Props) {
  const router = useRouter()
  const pathname = usePathname()

  const total = simulations.length
  const preQualified = simulations.filter((s) => s.status === 'pre_qualificado').length
  const totalVolume = simulations.reduce((sum, s) => sum + Number(s.desired_amount), 0)

  const displayed =
    activeStatus === 'rascunho' || activeStatus === 'pre_qualificado'
      ? simulations.filter((s) => s.status === activeStatus)
      : simulations

  function setFilter(status: string | undefined) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

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

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeStatus === tab.value
                ? 'bg-foreground text-background'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      {displayed.length === 0 ? (
        <EmptyState />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Data</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Produto</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Cliente</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Telefone</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Crédito
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Parcela
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Prazo</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((sim) => {
                  const product = Array.isArray(sim.products)
                    ? sim.products[0]
                    : sim.products

                  return (
                    <tr
                      key={sim.id}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatDate(sim.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{sim.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium">{product?.name ?? '—'}</td>
                      <td className="px-4 py-3">{sim.client_name}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatPhone(sim.client_phone)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {brl(Number(sim.desired_amount))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {sim.estimated_payment ? brl(Number(sim.estimated_payment)) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {sim.desired_term_months}x
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={sim.status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
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

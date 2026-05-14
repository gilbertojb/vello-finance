'use client'

import { CheckCircle2, FileText, Layers, TrendingUp } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

import type { ProposalRow } from '../queries'

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

const STATUS_LABELS: Record<string, string> = {
  simulation:  'Simulação',
  in_pipeline: 'Em análise',
  approved:    'Aprovada',
  rejected:    'Reprovada',
  cancelled:   'Cancelada',
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">
        Aprovada
      </Badge>
    )
  }
  if (status === 'in_pipeline') {
    return (
      <Badge className="border-primary/20 bg-primary/10 text-primary hover:bg-primary/20">
        Em análise
      </Badge>
    )
  }
  if (status === 'rejected') {
    return <Badge variant="destructive">Reprovada</Badge>
  }
  if (status === 'cancelled') {
    return <Badge variant="outline">Cancelada</Badge>
  }
  return <Badge variant="secondary">Simulação</Badge>
}

const STATUS_FILTERS = [
  { label: 'Todas',       value: undefined },
  { label: 'Em análise',  value: 'in_pipeline' },
  { label: 'Aprovadas',   value: 'approved' },
  { label: 'Reprovadas',  value: 'rejected' },
  { label: 'Simulações',  value: 'simulation' },
] as const

interface Props {
  proposals: ProposalRow[]
  activeStatus?: string
}

export function ProposalsList({ proposals, activeStatus }: Props) {
  const router   = useRouter()
  const pathname = usePathname()

  const total       = proposals.length
  const inPipeline  = proposals.filter((p) => p.status === 'in_pipeline').length
  const approved    = proposals.filter((p) => p.status === 'approved').length
  const pipelineVol = proposals
    .filter((p) => p.status === 'in_pipeline')
    .reduce((sum, p) => sum + Number(p.desired_amount), 0)

  const displayed =
    activeStatus && STATUS_LABELS[activeStatus]
      ? proposals.filter((p) => p.status === activeStatus)
      : proposals

  function setFilter(status: string | undefined) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de propostas</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Em análise</p>
            <p className="text-2xl font-bold">{inPipeline}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
            <p className="text-2xl font-bold">{approved}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume em análise</p>
            <p className="truncate text-2xl font-bold">{brl(pipelineVol)}</p>
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

      {/* Table */}
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
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">E-mail</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Telefone</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Crédito
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                    Parcela
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Prazo</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Etapa</th>
                  <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((proposal) => {
                  const product = Array.isArray(proposal.products)
                    ? proposal.products[0]
                    : proposal.products
                  const stage = Array.isArray(proposal.proposal_stages)
                    ? proposal.proposal_stages[0]
                    : proposal.proposal_stages

                  return (
                    <tr
                      key={proposal.id}
                      className="border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatDate(proposal.created_at)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        #{proposal.id.slice(0, 8)}
                      </td>
                      <td className="px-4 py-3 font-medium">{product?.name ?? '—'}</td>
                      <td className="px-4 py-3">{proposal.client_name}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-xs text-muted-foreground">
                        {proposal.client_email}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatPhone(proposal.client_phone)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium">
                        {brl(Number(proposal.desired_amount))}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {proposal.estimated_payment
                          ? brl(Number(proposal.estimated_payment))
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {proposal.desired_term_months}x
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {stage?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={proposal.status} />
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
        <FileText className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma proposta ainda</h3>
      <p className="mt-2 max-w-[380px] text-sm text-muted-foreground">
        Quando clientes enviarem propostas pela sua loja, elas aparecerão aqui com status e etapa
        do pipeline.
      </p>
    </div>
  )
}

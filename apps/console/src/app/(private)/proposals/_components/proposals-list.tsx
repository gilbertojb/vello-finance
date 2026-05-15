'use client'

import { CheckCircle2, FileText, Layers, TrendingUp } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { ProposalRow } from '../queries'

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
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
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: 'color-mix(in oklch, var(--success) 15%, transparent)', color: 'var(--success)' }}
      >
        <span className="size-1.5 rounded-full" style={{ background: 'var(--success)' }} />
        Aprovada
      </span>
    )
  }
  if (status === 'in_pipeline') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: 'color-mix(in oklch, var(--primary) 12%, transparent)', color: 'var(--primary)' }}
      >
        <span className="size-1.5 rounded-full" style={{ background: 'var(--primary)' }} />
        Em análise
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
        style={{ background: 'color-mix(in oklch, var(--destructive) 14%, transparent)', color: 'var(--destructive)' }}
      >
        <span className="size-1.5 rounded-full" style={{ background: 'var(--destructive)' }} />
        Reprovada
      </span>
    )
  }
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground">
        <span className="size-1.5 rounded-full bg-muted-foreground" />
        Cancelada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground" />
      Simulação
    </span>
  )
}

const STATUS_FILTERS = [
  { label: 'Todas',      value: undefined },
  { label: 'Em análise', value: 'in_pipeline' },
  { label: 'Aprovadas',  value: 'approved' },
  { label: 'Reprovadas', value: 'rejected' },
  { label: 'Simulações', value: 'simulation' },
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
  const pipelineVol = proposals.filter((p) => p.status === 'in_pipeline').reduce((sum, p) => sum + Number(p.desired_amount), 0)

  const displayed = activeStatus && STATUS_LABELS[activeStatus]
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
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-card p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <FileText className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total de propostas</p>
            <p className="text-2xl font-bold">{total}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-card p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Em análise</p>
            <p className="text-2xl font-bold">{inPipeline}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-card p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
            <p className="text-2xl font-bold">{approved}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-primary/10 bg-card p-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
            <TrendingUp className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Volume em análise</p>
            <p className="truncate text-2xl font-bold">{brl(pipelineVol)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setFilter(tab.value)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeStatus === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-primary/10 bg-foreground/2 text-left">
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">Data</th>
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">ID</th>
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">Produto</th>
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">Cliente</th>
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">E-mail</th>
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">Telefone</th>
                  <th className="p-4 text-right text-xs font-medium uppercase tracking-widest text-foreground/55">Crédito</th>
                  <th className="p-4 text-right text-xs font-medium uppercase tracking-widest text-foreground/55">Parcela</th>
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">Prazo</th>
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">Etapa</th>
                  <th className="p-4 text-xs font-medium uppercase tracking-widest text-foreground/55">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((proposal) => {
                  const product = Array.isArray(proposal.products) ? proposal.products[0] : proposal.products
                  const stage   = Array.isArray(proposal.proposal_stages) ? proposal.proposal_stages[0] : proposal.proposal_stages
                  return (
                    <tr key={proposal.id} className="border-b border-primary/8 transition-colors last:border-0 hover:bg-foreground/[2.5%]">
                      <td className="p-4 font-mono text-xs text-foreground/55">{formatDate(proposal.created_at)}</td>
                      <td className="p-4 font-mono text-xs text-foreground/55">#{proposal.id.slice(0, 8)}</td>
                      <td className="p-4 font-medium text-foreground">{product?.name ?? '—'}</td>
                      <td className="p-4 text-foreground">{proposal.client_name}</td>
                      <td className="max-w-44 truncate p-4 text-xs text-foreground/55">{proposal.client_email}</td>
                      <td className="p-4 font-mono text-xs text-foreground/55">{formatPhone(proposal.client_phone)}</td>
                      <td className="p-4 text-right font-mono font-medium text-foreground">{brl(Number(proposal.desired_amount))}</td>
                      <td className="p-4 text-right font-mono text-foreground/55">{proposal.estimated_payment ? brl(Number(proposal.estimated_payment)) : '—'}</td>
                      <td className="p-4 text-xs text-foreground/55">{proposal.desired_term_months}x</td>
                      <td className="p-4 text-xs text-foreground/55">{stage?.name ?? '—'}</td>
                      <td className="p-4"><StatusBadge status={proposal.status} /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
        Quando clientes enviarem propostas pela sua loja, elas aparecerão aqui com status e etapa do pipeline.
      </p>
    </div>
  )
}

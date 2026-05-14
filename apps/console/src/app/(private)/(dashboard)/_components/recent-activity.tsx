import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

import type { RecentProposal, RecentSimulation } from '../queries'

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

// ─── Simulations ─────────────────────────────────────────────────────────────

function SimulationStatusBadge({ status }: { status: string }) {
  if (status === 'pre_qualificado') {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-600">
        Pré-qualificado
      </Badge>
    )
  }
  return <Badge variant="secondary">Simulação</Badge>
}

interface RecentSimulationsProps {
  simulations: RecentSimulation[]
}

export function RecentSimulations({ simulations }: RecentSimulationsProps) {
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Últimas simulações</h2>
          <p className="text-xs text-muted-foreground">5 mais recentes</p>
        </div>
        <Link
          href="/simulations"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      {simulations.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          Nenhuma simulação ainda.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border/50">
          {simulations.map((sim) => {
            const product = Array.isArray(sim.products) ? sim.products[0] : sim.products
            return (
              <div key={sim.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {sim.client_name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {product?.name ?? '—'} · {formatDate(sim.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-xs font-semibold">
                    {brl(Number(sim.desired_amount))}
                  </span>
                  <SimulationStatusBadge status={sim.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── Proposals ───────────────────────────────────────────────────────────────

const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  simulation:  'Simulação',
  in_pipeline: 'Em análise',
  approved:    'Aprovada',
  rejected:    'Reprovada',
  cancelled:   'Cancelada',
}

function ProposalStatusBadge({ status }: { status: string }) {
  if (status === 'approved') {
    return (
      <Badge className="border-emerald-500/20 bg-emerald-500/15 text-emerald-600">
        Aprovada
      </Badge>
    )
  }
  if (status === 'in_pipeline') {
    return (
      <Badge className="border-primary/20 bg-primary/10 text-primary">
        Em análise
      </Badge>
    )
  }
  if (status === 'rejected') {
    return <Badge variant="destructive">Reprovada</Badge>
  }
  return (
    <Badge variant="secondary">
      {PROPOSAL_STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

interface RecentProposalsProps {
  proposals: RecentProposal[]
}

export function RecentProposals({ proposals }: RecentProposalsProps) {
  return (
    <Card className="flex flex-col p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">Últimas propostas</h2>
          <p className="text-xs text-muted-foreground">5 mais recentes</p>
        </div>
        <Link
          href="/proposals"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todas →
        </Link>
      </div>

      {proposals.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          Nenhuma proposta ainda.
        </p>
      ) : (
        <div className="flex flex-col divide-y divide-border/50">
          {proposals.map((proposal) => {
            const product = Array.isArray(proposal.products)
              ? proposal.products[0]
              : proposal.products
            return (
              <div key={proposal.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">
                    {proposal.client_name}
                  </p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {product?.name ?? '—'} · {formatDate(proposal.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-xs font-semibold">
                    {brl(Number(proposal.desired_amount))}
                  </span>
                  <ProposalStatusBadge status={proposal.status} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

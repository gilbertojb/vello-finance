// apps/console/src/app/(private)/proposals/[id]/_components/proposal-timeline.tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getRequiredDocs } from '../../required-documents'
import type { ProposalDetail } from '../../queries'

type ProposalEvent = NonNullable<ProposalDetail['proposal_events']>[number]

interface TimelineStep {
  key: string
  label: string
  matchStatus: string
}

function buildSteps(productTypeSlug: string, currentStatus: string): TimelineStep[] {
  const hasDocsStep = getRequiredDocs(productTypeSlug).length > 0
  const isReprovada = currentStatus === 'reprovada'

  const steps: TimelineStep[] = [
    { key: 'nova_proposta',   label: 'Proposta criada',      matchStatus: 'nova_proposta' },
    ...(hasDocsStep
      ? [{ key: 'proposta_criada', label: 'Documentos enviados', matchStatus: 'proposta_criada' }]
      : []),
    { key: 'em_analise',       label: 'Em análise',           matchStatus: 'em_analise' },
    ...(isReprovada
      ? [{ key: 'reprovada', label: 'Reprovada', matchStatus: 'reprovada' }]
      : [
          { key: 'pre_aprovada', label: 'Pré-aprovada', matchStatus: 'pre_aprovada' },
          { key: 'aprovada',     label: 'Aprovada',     matchStatus: 'aprovada' },
        ]
    ),
  ]
  return steps
}

interface ProposalTimelineProps {
  proposal: ProposalDetail
}

export function ProposalTimeline({ proposal }: ProposalTimelineProps) {
  const events: ProposalEvent[] = Array.isArray(proposal.proposal_events)
    ? proposal.proposal_events
    : proposal.proposal_events ? [proposal.proposal_events] : []

  const eventMap = new Map(events.map((e) => [e.to_status, e]))

  // Fallback: se não há eventos, usa created_at da proposta como "proposta criada"
  if (!eventMap.has('nova_proposta')) {
    eventMap.set('nova_proposta', {
      id: 'fallback',
      from_status: null,
      to_status: 'nova_proposta',
      created_at: proposal.created_at,
    } as ProposalEvent)
  }

  const steps = buildSteps(proposal.product_type_slug, proposal.status)

  const completedStatuses = new Set(events.map((e) => e.to_status))
  completedStatuses.add('nova_proposta')

  const currentStepIndex = steps.findIndex((s) => s.matchStatus === proposal.status)

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Timeline
        </p>

        <div className="flex flex-col">
          {steps.map((step, i) => {
            const event = eventMap.get(step.matchStatus)
            const isDone = completedStatuses.has(step.matchStatus) && i < currentStepIndex
            const isCurrent = step.matchStatus === proposal.status
            const isUpcoming = !isDone && !isCurrent
            const isLast = i === steps.length - 1

            return (
              <div key={step.key} className="flex gap-3">
                {/* Track */}
                <div className="flex flex-col items-center">
                  <div className={cn(
                    'mt-0.5 size-2.5 shrink-0 rounded-full',
                    isDone && 'bg-success',
                    isCurrent && 'bg-primary ring-2 ring-primary/20',
                    isUpcoming && 'border-2 border-border bg-background',
                  )} />
                  {!isLast && (
                    <div className={cn(
                      'w-px flex-1 my-1',
                      isDone ? 'bg-success/30' : 'bg-border',
                    )} style={{ minHeight: '20px' }} />
                  )}
                </div>

                {/* Content */}
                <div className={cn('pb-3', isLast && 'pb-0')}>
                  <p className={cn(
                    'text-sm font-semibold leading-tight',
                    isCurrent && 'text-primary',
                    isUpcoming && 'font-normal text-muted-foreground',
                  )}>
                    {step.label}
                  </p>
                  {event && (isDone || isCurrent) && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {format(new Date(event.created_at), "d MMM yyyy · HH:mm", { locale: ptBR })}
                    </p>
                  )}
                  {isCurrent && (
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                      Etapa atual
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

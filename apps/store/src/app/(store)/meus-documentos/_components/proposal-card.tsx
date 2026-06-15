import Link from 'next/link'
import { ArrowRight, CheckCircle2, Clock } from 'lucide-react'

import { getStatusLabel } from '@vello/proposals-shared/status-config'

interface Props {
  id: string
  status: string
  productName: string
  pendingCount: number
}

export function ProposalCard({ id, status, productName, pendingCount }: Props) {
  const allSent = pendingCount === 0
  return (
    <Link
      href={`/meus-documentos/propostas/${id}`}
      className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            PROP-{id.slice(0, 4).toUpperCase()}
          </p>
          <h3 className="text-lg font-semibold text-foreground">{productName}</h3>
        </div>
        <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-foreground">
          {getStatusLabel(status)}
        </span>

        {allSent ? (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <CheckCircle2 className="size-3" />
            Tudo enviado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-md border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning">
            <Clock className="size-3" />
            {pendingCount} pendente{pendingCount > 1 ? 's' : ''}
          </span>
        )}
      </div>
    </Link>
  )
}

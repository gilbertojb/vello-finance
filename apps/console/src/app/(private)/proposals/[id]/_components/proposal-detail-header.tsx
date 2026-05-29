// apps/console/src/app/(private)/proposals/[id]/_components/proposal-detail-header.tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { STATUS_CFG } from '@/app/(private)/proposals/status-config'
import type { ProposalDetail } from '@/app/(private)/proposals/queries'

function getInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

function avatarColor(name: string): string {
  const palettes = [
    'bg-chart-1/20 text-chart-1',
    'bg-chart-2/20 text-chart-2',
    'bg-chart-3/20 text-chart-3',
    'bg-chart-4/20 text-chart-4',
    'bg-chart-5/20 text-chart-5',
  ]
  let h = 0
  for (const c of name) h = ((h << 5) - h + c.charCodeAt(0)) | 0
  return palettes[Math.abs(h) % palettes.length]
}

interface ProposalDetailHeaderProps {
  proposal: ProposalDetail
}

export function ProposalDetailHeader({ proposal }: ProposalDetailHeaderProps) {
  const product = Array.isArray(proposal.products) ? proposal.products[0] : proposal.products
  const clientName = proposal.client_name ?? 'Cliente'
  const initials = getInitials(clientName)
  const avColor = avatarColor(clientName)
  const shortId = `PROP-${proposal.id.replace(/-/g, '').slice(0, 5).toUpperCase()}`
  const createdAt = format(new Date(proposal.created_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
  const statusCfg = STATUS_CFG[proposal.status]

  return (
    <Card className="mb-4">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-11 rounded-xl">
            <AvatarFallback className={cn('rounded-xl text-sm font-bold', avColor)}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold leading-tight">{clientName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {product?.name && <span>{product.name}</span>}
              {product?.name && <span className="text-border">·</span>}
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                {shortId}
              </span>
              <span className="text-border">·</span>
              <span>Criada em {createdAt}</span>
            </div>
          </div>
        </div>

        {statusCfg && (
          <div className="flex items-center gap-2">
            <span className={cn('size-1.5 rounded-full', statusCfg.dotColor)} />
            <span className={cn('text-sm font-medium', statusCfg.textColor)}>
              {statusCfg.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

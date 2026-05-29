import Link from 'next/link'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { cn } from '@/lib/utils'

import { STATUS_CFG } from '../status-config'
import type { ProposalRow } from '../queries'

// ── Helpers locais ─────────────────────────────────────────────────────────────

function brlFull(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

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

function sinceDate(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (diff === 0) return 'hoje'
  if (diff === 1) return 'há 1d'
  return `há ${diff}d`
}

const PRODUCT_COLOR: Record<string, string> = {
  'FGTS': 'bg-chart-1',
  'Consignado INSS': 'bg-chart-2',
  'Consignado Federal': 'bg-chart-3',
  'Consignado Privado': 'bg-chart-4',
  'Crédito Pessoal': 'bg-chart-5',
}

// ── Componente ─────────────────────────────────────────────────────────────────

interface ProposalCardProps {
  proposal: ProposalRow
}

export function ProposalCard({ proposal }: ProposalCardProps) {
  const product    = Array.isArray(proposal.products) ? proposal.products[0] : proposal.products
  const simulation = Array.isArray(proposal.simulations) ? proposal.simulations[0] : proposal.simulations

  const clientName  = proposal.client_name ?? simulation?.client_name ?? 'Cliente'
  const clientPhone = proposal.client_phone ?? simulation?.client_phone

  const amount  = simulation ? Number(simulation.desired_amount) : 0
  const payment = simulation?.estimated_payment ? Number(simulation.estimated_payment) : null
  const rate    = simulation?.estimated_rate != null ? Number(simulation.estimated_rate) : null

  const initials   = getInitials(clientName)
  const avColorCls = avatarColor(clientName)
  const shortId    = `PROP-${proposal.id.replace(/-/g, '').slice(0, 5).toUpperCase()}`
  const dateStr    = sinceDate(proposal.created_at)

  const statusCfg    = STATUS_CFG[proposal.status]
  const productColor = (product?.name && PRODUCT_COLOR[product.name]) ?? 'bg-muted-foreground'

  return (
    <Link href={`/proposals/${proposal.id}`} className="block">
    <Card className="gap-3 py-0 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 hover:border-primary/30">
      <CardContent className="flex flex-col gap-3 pt-4">
        {/* ID + produto */}
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">{shortId}</span>
          {product?.name && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn('inline-block size-2 rounded-sm', productColor)} />
              {product.name}
            </span>
          )}
        </div>

        {/* Cliente */}
        <div className="flex items-center gap-2.5">
          <Avatar size="default">
            <AvatarFallback className={cn('text-xs font-bold', avColorCls)}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">{clientName}</p>
            <p className="truncate text-xs text-muted-foreground">{clientPhone ?? '—'}</p>
          </div>
        </div>

        {/* Valor */}
        {amount > 0 ? (
          <div>
            <p className="text-lg font-bold tracking-tight">{brlFull(amount)}</p>
            <p className="text-xs text-muted-foreground">
              {simulation?.desired_term_months}× {payment ? brlFull(payment) : '—'}
              {rate != null ? ` · ${rate.toFixed(2)}% a.m.` : ''}
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Valor não informado</p>
        )}

        {/* Status */}
        {statusCfg && (
          <Badge
            variant={statusCfg.variant}
            className={cn('w-fit', statusCfg.className)}
          >
            {statusCfg.label}
          </Badge>
        )}
      </CardContent>

      <CardFooter className="bg-transparent px-4">
        <span className="text-xs text-muted-foreground">{dateStr}</span>
      </CardFooter>
    </Card>
    </Link>
  )
}

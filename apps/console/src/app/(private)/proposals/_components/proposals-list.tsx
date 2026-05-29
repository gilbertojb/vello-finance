'use client'

import { useMemo, useState } from 'react'
import { type DateRange } from 'react-day-picker'
import {
  FileText,
  LayoutGrid,
  Search,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import type { ProposalRow } from '../queries'
import { STATUS_CFG, STATUS_FILTERS } from '../status-config'
import { DateRangePicker } from '@/components/date-range-picker'
import { ProposalCard } from './proposal-card'

function EmptyState() {
  return (
    <Card className="py-14">
      <CardContent className="flex flex-col items-center text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted">
          <FileText className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-base font-medium">Nenhuma proposta encontrada</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Quando clientes enviarem propostas pela sua loja, elas aparecerão aqui com status e etapa
          do pipeline.
        </p>
      </CardContent>
    </Card>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface ProposalsListProps {
  proposals: ProposalRow[]
}

export function ProposalsList({ proposals }: ProposalsListProps) {
  const [activeProduct, setActiveProduct] = useState<string | undefined>()
  const [activeStatus, setActiveStatus] = useState<string | undefined>()
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const productTypes = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of proposals) {
      const prod = Array.isArray(p.products) ? p.products[0] : p.products
      const name = prod?.name ?? 'Sem produto'
      map.set(name, (map.get(name) ?? 0) + 1)
    }
    return Array.from(map.entries())
  }, [proposals])

  const displayed = useMemo(() => {
    const from = dateRange?.from ? new Date(dateRange.from).setHours(0, 0, 0, 0) : null
    const to   = dateRange?.to   ? new Date(dateRange.to).setHours(23, 59, 59, 999) : null

    return proposals.filter((p) => {
      if (activeStatus && p.status !== activeStatus) return false

      if (activeProduct) {
        const prod = Array.isArray(p.products) ? p.products[0] : p.products
        if (prod?.name !== activeProduct) return false
      }

      if (from !== null) {
        const created = new Date(p.created_at).getTime()
        if (created < from) return false
        if (to !== null && created > to) return false
      }

      if (search) {
        const q    = search.toLowerCase()
        const sim  = Array.isArray(p.simulations) ? p.simulations[0] : p.simulations
        const name  = (p.client_name ?? sim?.client_name ?? '').toLowerCase()
        const phone = (p.client_phone ?? sim?.client_phone ?? '').toLowerCase()
        if (!name.includes(q) && !phone.includes(q) && !p.id.toLowerCase().includes(q)) return false
      }

      return true
    })
  }, [proposals, activeStatus, activeProduct, dateRange, search])

  return (
    <div className="flex flex-col gap-5">
      {/* Filtro por produto */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-center gap-1">
          <Button
            variant={!activeProduct ? 'secondary' : 'ghost'}
            size="sm"
            className="gap-2 rounded-full"
            onClick={() => setActiveProduct(undefined)}
          >
            <LayoutGrid size={13} />
            Todos
            <Badge variant="outline" className="text-xs">{proposals.length}</Badge>
          </Button>

          {productTypes.map(([name, count]) => (
            <Button
              key={name}
              variant={activeProduct === name ? 'secondary' : 'ghost'}
              size="sm"
              className="gap-2 rounded-full"
              onClick={() => setActiveProduct(activeProduct === name ? undefined : name)}
            >
              {name}
              <Badge variant="outline" className="text-xs">{count}</Badge>
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Toolbar: status + busca + período */}
      <Card className="py-3">
        <CardContent className="flex flex-wrap items-center gap-3">
          {/* Status tabs */}
          <div className="flex flex-1 flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-0.5">
            {STATUS_FILTERS.map((tab) => {
              const count    = tab.value ? proposals.filter((p) => p.status === tab.value).length : proposals.length
              const isActive = activeStatus === tab.value || (!activeStatus && !tab.value)
              const statusCfg = tab.value ? STATUS_CFG[tab.value] : undefined
              return (
                <Button
                  key={tab.label}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveStatus(isActive ? undefined : tab.value)}
                  className="gap-1.5"
                >
                  {statusCfg && (
                    <span className={cn(
                      'size-1.5 shrink-0 rounded-full',
                      isActive ? 'bg-primary-foreground/70' : `${statusCfg.variant === 'destructive' ? 'bg-destructive' : statusCfg.variant === 'default' ? 'bg-primary' : 'bg-muted-foreground'}`,
                    )} />
                  )}
                  {tab.label}
                  <span className={cn(
                    'rounded-full px-1.5 py-px text-xs font-semibold',
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-foreground/10 text-muted-foreground',
                  )}>
                    {count}
                  </span>
                </Button>
              )
            })}
          </div>

          {/* Busca */}
          <div className="relative min-w-52">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar por nome, telefone, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Período */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </CardContent>
      </Card>

      {/* Grid de cards */}
      {displayed.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
          {displayed.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </div>
      )}
    </div>
  )
}

// apps/console/src/app/(private)/proposals/[id]/_components/proposal-origin.tsx
import { User } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface ProposalOriginProps {
  tenantName: string
}

export function ProposalOrigin({ tenantName }: ProposalOriginProps) {
  const initials = tenantName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')

  return (
    <Card>
      <CardContent className="py-4">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Origem
        </p>

        <div className="flex items-center gap-2.5">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary text-xs font-bold">
            {initials || '?'}
          </div>
          <div>
            <p className="text-sm font-semibold">{tenantName}</p>
            <p className="text-xs text-muted-foreground">Canal: Web · Store</p>
          </div>
        </div>

        <Separator className="my-3" />

        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Vendedor
        </p>
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/40 px-2.5 py-2">
          <div className="grid size-6 shrink-0 place-items-center rounded-full bg-border">
            <User className="size-3 text-muted-foreground" />
          </div>
          <p className="text-xs italic text-muted-foreground">Disponível em breve</p>
        </div>
      </CardContent>
    </Card>
  )
}

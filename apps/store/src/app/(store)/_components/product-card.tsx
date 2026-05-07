import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils/simulator'

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  fgts: 'FGTS',
  consignado_publico: 'Consignado Público',
  consignado_privado: 'Consignado Privado',
  home_equity: 'Home Equity',
  auto_equity: 'Auto Equity',
  outros: 'Outros',
}

const PRODUCT_TYPE_GRADIENTS: Record<string, string> = {
  fgts: 'from-blue-500/20 to-blue-600/30',
  consignado_publico: 'from-emerald-500/20 to-emerald-600/30',
  consignado_privado: 'from-violet-500/20 to-violet-600/30',
  home_equity: 'from-amber-500/20 to-amber-600/30',
  auto_equity: 'from-rose-500/20 to-rose-600/30',
  outros: 'from-muted to-muted',
}

type Props = {
  tenantProductId: string
  coverUrl: string | null
  productName: string
  productType: string
  minAmount: number | null
  maxAmount: number | null
  minTermMonths: number | null
  maxTermMonths: number | null
}

export function ProductCard({
  tenantProductId,
  coverUrl,
  productName,
  productType,
  minAmount,
  maxAmount,
  minTermMonths,
  maxTermMonths,
}: Props) {
  const gradient = PRODUCT_TYPE_GRADIENTS[productType] ?? PRODUCT_TYPE_GRADIENTS.outros
  const typeLabel = PRODUCT_TYPE_LABELS[productType] ?? productType

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-40 overflow-hidden">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={productName}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
        )}
        <div className="absolute left-3 top-3">
          <Badge variant="secondary" className="text-xs font-medium">
            {typeLabel}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 text-base font-semibold text-foreground">{productName}</h3>

        <div className="mb-4 space-y-1 text-sm text-muted-foreground">
          {minAmount !== null && maxAmount !== null && (
            <p>
              De {formatCurrency(minAmount)} até {formatCurrency(maxAmount)}
            </p>
          )}
          {minTermMonths !== null && maxTermMonths !== null && (
            <p>
              {minTermMonths} a {maxTermMonths} meses
            </p>
          )}
        </div>

        <div className="mt-auto">
          <Button asChild className="w-full">
            <Link href={`/produto/${tenantProductId}`}>Simular agora</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

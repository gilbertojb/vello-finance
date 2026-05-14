import Link from 'next/link'
import { Wallet, Shield, Home, Car, Zap, Briefcase, ArrowRight } from 'lucide-react'
import type { ElementType } from 'react'
import { formatCurrency } from '@/lib/utils/simulator'
import { cn } from '@/lib/utils'

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  fgts: 'FGTS',
  consignado_publico: 'Consignado Público',
  consignado_privado: 'Consignado Privado',
  home_equity: 'Home Equity',
  auto_equity: 'Auto Equity',
  outros: 'Outros',
}

const TYPE_ICONS: Record<string, ElementType> = {
  fgts: Shield,
  consignado_publico: Briefcase,
  consignado_privado: Wallet,
  home_equity: Home,
  auto_equity: Car,
  outros: Zap,
}

type Props = {
  tenantProductId: string
  coverUrl: string | null
  productName: string
  productTypeSlug: string | null
  minAmount: number | null
  maxAmount: number | null
  minTermMonths: number | null
  maxTermMonths: number | null
  featured?: boolean
}

export function ProductCard({
  tenantProductId,
  productName,
  productTypeSlug,
  minAmount,
  maxAmount,
  minTermMonths,
  maxTermMonths,
  featured = false,
}: Props) {
  const slug = productTypeSlug ?? 'outros'
  const typeLabel = PRODUCT_TYPE_LABELS[slug] ?? slug
  const Icon = TYPE_ICONS[slug] ?? Zap

  return (
    <Link
      href={`/product/${tenantProductId}`}
      className={cn(
        'group flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border transition-all duration-200 hover:-translate-y-[3px]',
        featured
          ? 'border-primary/18 bg-gradient-to-b from-card to-background text-foreground hover:shadow-[0_30px_50px_-25px_oklch(0.83_0.10_85/20%)]'
          : 'border-black/[0.06] bg-surface text-surface-foreground hover:shadow-[0_30px_50px_-25px_oklch(0.12_0.01_50/15%)]',
      )}
    >
      <div className="flex items-start justify-between px-[26px] pt-6">
        <span className={cn('text-[10px] font-semibold uppercase tracking-[.22em]', featured ? 'text-primary' : 'text-surface-foreground/50')}>
          {typeLabel}
        </span>
      </div>

      <div className={cn('mx-[26px] mt-6 grid h-12 w-12 place-items-center rounded-[12px]', featured ? 'bg-primary/12 text-primary' : 'bg-surface-foreground/[0.08] text-surface-foreground/60')}>
        <Icon className="h-5 w-5" />
      </div>

      {featured && (
        <div
          className="relative mt-2 h-[100px] overflow-hidden border-y border-primary/10"
          style={{ background: 'radial-gradient(60% 80% at 80% 20%, oklch(0.83 0.10 85 / 0.22), transparent 60%), repeating-linear-gradient(45deg, oklch(0.83 0.10 85 / 0.06) 0 1px, transparent 1px 14px)' }}
        >
          <div className="absolute bottom-[18px] left-[26px] flex flex-col gap-1.5">
            <div className="h-[5px] w-[140px] rounded-full bg-primary" />
            <div className="h-[5px] w-[90px] rounded-full bg-primary/40" />
            <div className="h-[5px] w-[60px] rounded-full bg-primary/25" />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col px-[26px] py-[18px]">
        <h3 className={cn('mb-2 leading-tight tracking-tight', featured ? 'text-[28px] font-light' : 'text-[22px] font-semibold')}>
          {featured ? (
            <>{productName.split(' ')[0]}{' '}
              <em className="font-serif not-italic font-normal text-primary">{productName.split(' ').slice(1).join(' ')}</em>
            </>
          ) : productName}
        </h3>

        <div className={cn('mt-auto grid grid-cols-2 gap-3.5 border-t pt-[18px]', featured ? 'border-primary/14' : 'border-black/[0.08]')}>
          {minAmount != null && maxAmount != null && (
            <div>
              <div className={cn('text-[10px] font-medium uppercase tracking-[.16em]', featured ? 'text-foreground/45' : 'text-surface-foreground/45')}>Valor até</div>
              <div className={cn('mt-1 text-lg font-semibold tracking-tight', featured ? 'text-primary' : 'text-surface-foreground')}>{formatCurrency(maxAmount)}</div>
            </div>
          )}
          {minTermMonths != null && maxTermMonths != null && (
            <div>
              <div className={cn('text-[10px] font-medium uppercase tracking-[.16em]', featured ? 'text-foreground/45' : 'text-surface-foreground/45')}>Prazo até</div>
              <div className={cn('mt-1 text-lg font-semibold tracking-tight', featured ? 'text-foreground' : 'text-surface-foreground')}>{maxTermMonths} meses</div>
            </div>
          )}
        </div>
      </div>

      <div className={cn('flex items-center justify-between border-t px-[26px] py-4 text-sm font-semibold', featured ? 'border-primary/14 bg-primary/[0.04] text-primary' : 'border-black/[0.06] bg-black/[0.02] text-surface-foreground/70')}>
        <span>Simular condições</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

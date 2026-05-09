import Link from 'next/link'
import { Wallet, Shield, Home, Car, Zap, Briefcase } from 'lucide-react'
import type { ElementType } from 'react'

const TYPE_ICONS: Record<string, ElementType> = {
  fgts: Shield,
  consignado_publico: Briefcase,
  consignado_privado: Wallet,
  home_equity: Home,
  auto_equity: Car,
  outros: Zap,
}

const TYPE_LABELS: Record<string, string> = {
  fgts: 'FGTS',
  consignado_publico: 'Consignado',
  consignado_privado: 'Consignado',
  home_equity: 'Garantia',
  auto_equity: 'Veículo',
  outros: 'Crédito',
}

type ChipProduct = {
  id: string
  typeSlug: string
  rate: number | null
}

type Props = {
  products: ChipProduct[]
}

export function ProductStrip({ products }: Props) {
  const seen = new Set<string>()
  const chips = products
    .filter((p) => { if (seen.has(p.typeSlug)) return false; seen.add(p.typeSlug); return true })
    .slice(0, 4)

  if (chips.length === 0) return null

  return (
    <div className="mx-auto max-w-7xl px-8 pb-16">
      <div className="grid grid-cols-4 gap-3.5 max-sm:grid-cols-2">
        {chips.map((chip) => {
          const Icon = TYPE_ICONS[chip.typeSlug] ?? Zap
          const label = TYPE_LABELS[chip.typeSlug] ?? 'Crédito'
          const rate = chip.rate != null ? chip.rate.toFixed(2).replace('.', ',') : '--'
          return (
            <Link
              key={chip.id}
              href={`/produto/${chip.id}`}
              className="group flex items-center gap-3.5 rounded-[14px] border border-foreground/[0.08] bg-foreground/[0.04] p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/[0.06]"
            >
              <div className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-[10px] bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] font-medium uppercase tracking-[.2em] text-foreground/50">{label}</div>
                <div className="mt-0.5 text-sm font-semibold text-foreground">{rate}% a.m.</div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

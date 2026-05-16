import Link from 'next/link'
import { Wallet, Shield, Home, Car, Zap, Briefcase, Building, TrendingUp, ArrowRight, Sun } from 'lucide-react'
import type { ElementType } from 'react'
import { formatCurrency } from '@/lib/utils/simulator'
import { cn } from '@/lib/utils'

export const PRODUCT_TYPE_LABELS: Record<string, string> = {
  fgts:                   'FGTS',
  consignado_publico:     'Consignado Público',
  consignado_privado:     'Consignado CLT',
  home_equity:            'Imóvel em Garantia',
  auto_equity:            'Veículo em Garantia',
  home_equity_pj:         'Imóvel em Garantia PJ',
  auto_equity_pj:         'Veículo em Garantia PJ',
  capital_giro:           'Capital de Giro',
  antecipacao_recebiveis: 'Antecipação de Recebíveis',
  financiamento_imovel:   'Financiamento Imobiliário',
  financiamento_veiculo:  'Financiamento de Veículos',
  emprestimo_pessoal:     'Empréstimo Pessoal',
  conta_luz:              'Conta de Luz',
  outros:                 'Outros',
}

export const TYPE_ICONS: Record<string, ElementType> = {
  fgts:                   Shield,
  consignado_publico:     Briefcase,
  consignado_privado:     Wallet,
  home_equity:            Home,
  auto_equity:            Car,
  home_equity_pj:         Building,
  auto_equity_pj:         Car,
  capital_giro:           TrendingUp,
  antecipacao_recebiveis: TrendingUp,
  financiamento_imovel:   Home,
  financiamento_veiculo:  Car,
  emprestimo_pessoal:     Wallet,
  conta_luz:              Sun,
  outros:                 Zap,
}

const SLUG_TO_SIMULATOR: Record<string, string> = {
  fgts:                   '/simulador/pessoa-fisica/fgts',
  consignado_privado:     '/simulador/pessoa-fisica/consignado',
  consignado_publico:     '/simulador/pessoa-fisica/consignado',
  home_equity:            '/simulador/pessoa-fisica/imovel-em-garantia',
  auto_equity:            '/simulador/pessoa-fisica/veiculo-em-garantia',
  emprestimo_pessoal:     '/simulador/pessoa-fisica/emprestimo-pessoal',
  conta_luz:              '/simulador/pessoa-fisica/conta-de-luz',
  home_equity_pj:         '/simulador/pessoa-juridica/imovel-em-garantia',
  auto_equity_pj:         '/simulador/pessoa-juridica/veiculo-em-garantia',
  capital_giro:           '/simulador/pessoa-juridica/capital-de-giro',
  antecipacao_recebiveis: '/simulador/pessoa-juridica/antecipacao-recebiveis',
  financiamento_imovel:   '/simulador/financiamentos/imovel',
  financiamento_veiculo:  '/simulador/financiamentos/veiculo',
}

const HAS_DEDICATED_SIMULATOR = new Set([
  'fgts', 'consignado_privado', 'consignado_publico',
  'home_equity', 'auto_equity', 'emprestimo_pessoal', 'conta_luz',
  'home_equity_pj', 'auto_equity_pj', 'capital_giro', 'antecipacao_recebiveis',
  'financiamento_imovel', 'financiamento_veiculo',
])

type Props = {
  tenantProductId: string
  coverUrl:        string | null
  productName:     string
  description:     string | null
  productTypeSlug: string | null
  minAmount:       number | null
  maxAmount:       number | null
  minTermMonths:   number | null
  maxTermMonths:   number | null
  minRate:         number | null
  isPopular:       boolean
  featured?:       boolean
}

export function ProductCard({
  tenantProductId,
  productName,
  description,
  productTypeSlug,
  minAmount,
  maxAmount,
  minTermMonths,
  maxTermMonths,
  minRate,
  isPopular,
  featured = false,
}: Props) {
  const slug      = productTypeSlug ?? 'outros'
  const typeLabel = PRODUCT_TYPE_LABELS[slug] ?? slug
  const Icon      = TYPE_ICONS[slug] ?? Zap

  const basePath = SLUG_TO_SIMULATOR[slug] ?? '/simulador'
  const href     = HAS_DEDICATED_SIMULATOR.has(slug)
    ? `${basePath}?productId=${tenantProductId}`
    : basePath

  if (featured) {
    return (
      <Link
        href={href}
        className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-primary/20 bg-background text-foreground transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_30px_50px_-25px_oklch(0.83_0.10_85/20%)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6">
          <span className="text-2xs font-semibold uppercase tracking-label text-foreground/40">
            {typeLabel}
          </span>
          <span className="rounded-full bg-primary px-3 py-1 text-2xs font-bold uppercase tracking-label text-primary-foreground">
            Popular
          </span>
        </div>

        {/* Icon */}
        <div className="mx-6 mt-5 grid h-11 w-11 place-items-center rounded-xl bg-foreground/10 text-foreground/70">
          <Icon className="h-5 w-5" />
        </div>

        {/* Decorative bars */}
        <div
          className="relative mx-6 mt-5 h-20 overflow-hidden rounded-xl border border-primary/15"
          style={{ background: 'radial-gradient(60% 80% at 80% 20%, oklch(0.83 0.10 85 / 0.20), transparent 60%), repeating-linear-gradient(45deg, oklch(0.83 0.10 85 / 0.05) 0 1px, transparent 1px 14px)' }}
        >
          <div className="absolute bottom-4 left-5 flex flex-col gap-1.5">
            <div className="h-1.5 w-36 rounded-full bg-primary" />
            <div className="h-1.5 w-24 rounded-full bg-primary/40" />
            <div className="h-1.5 w-16 rounded-full bg-primary/20" />
          </div>
        </div>

        {/* Title + description */}
        <div className="flex flex-1 flex-col px-6 pt-5">
          <h3 className="text-3xl font-light leading-tight tracking-tight">
            {productName.split(' ')[0]}{' '}
            <em className="font-serif not-italic font-normal text-primary">
              {productName.split(' ').slice(1).join(' ')}
            </em>
          </h3>
          {description && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-foreground/55">
              {description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mx-6 mb-5 mt-5 grid grid-cols-2 gap-4 border-t border-foreground/10 pt-4">
          {minRate != null && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-data text-foreground/40">A.M. a partir de</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-primary">
                {minRate.toFixed(2).replace('.', ',')}%
              </p>
            </div>
          )}
          {maxAmount != null && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-data text-foreground/40">Limite até</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {formatCurrency(maxAmount)}
              </p>
            </div>
          )}
          {maxTermMonths != null && maxAmount == null && (
            <div>
              <p className="text-2xs font-medium uppercase tracking-data text-foreground/40">Prazo até</p>
              <p className="mt-1 text-xl font-bold tracking-tight text-foreground">
                {maxTermMonths} meses
              </p>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div className="flex items-center justify-between border-t border-foreground/10 px-6 py-4 text-sm font-semibold text-primary">
          <span>Simular condições</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-surface-foreground/10 bg-white text-surface-foreground transition-all duration-200 hover:-translate-y-1 hover:border-surface-foreground/20 hover:shadow-[0_20px_40px_-15px_oklch(0.12_0.01_50/8%)]"
    >
      {/* Header */}
      <div className="flex items-start justify-between px-6 pt-6">
        <span className="text-2xs font-semibold uppercase tracking-label text-surface-foreground/45">
          {typeLabel}
        </span>
        {isPopular && (
          <span className="rounded-full bg-primary/15 px-3 py-1 text-2xs font-bold uppercase tracking-label text-primary">
            Popular
          </span>
        )}
      </div>

      {/* Icon */}
      <div className="mx-6 mt-5 grid h-11 w-11 place-items-center rounded-xl bg-surface-foreground/10 text-surface-foreground/60">
        <Icon className="h-5 w-5" />
      </div>

      {/* Title + description */}
      <div className="flex flex-1 flex-col px-6 pt-4">
        <h3 className="text-xl font-bold leading-tight tracking-tight text-surface-foreground">
          {productName}
        </h3>
        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-surface-foreground/55">
            {description}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mx-6 mb-5 mt-4 grid grid-cols-2 gap-4 border-t border-surface-foreground/10 pt-4">
        {minRate != null && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-data text-surface-foreground/40">A.M. a partir de</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-primary">
              {minRate.toFixed(2).replace('.', ',')}%
            </p>
          </div>
        )}
        {maxAmount != null && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-data text-surface-foreground/40">Até</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-surface-foreground">
              {formatCurrency(maxAmount)}
            </p>
          </div>
        )}
        {maxTermMonths != null && maxAmount == null && (
          <div>
            <p className="text-2xs font-medium uppercase tracking-data text-surface-foreground/40">Prazo até</p>
            <p className="mt-1 text-lg font-bold tracking-tight text-surface-foreground">
              {maxTermMonths} meses
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="flex items-center justify-between border-t border-surface-foreground/10 px-6 py-4 text-sm font-semibold text-surface-foreground/70">
        <span>Simular condições</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </Link>
  )
}

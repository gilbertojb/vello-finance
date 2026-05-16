'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/simulator'
import { PRODUCT_TYPE_LABELS, TYPE_ICONS } from '@/app/(store)/_components/product-card'
import type { TemplateHomeProduct } from '@/templates/_types'

// Slug do product_type → rota direta para o simulador (etapa 2)
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

function getHref(slug: string | null, tenantProductId: string): string {
  const s = slug ?? 'outros'
  const base = SLUG_TO_SIMULATOR[s] ?? '/simulador'
  return HAS_DEDICATED_SIMULATOR.has(s) ? `${base}?productId=${tenantProductId}` : base
}

function ZpFeaturedCard({ p }: { p: TemplateHomeProduct }) {
  const slug = p.productTypeSlug ?? 'outros'
  const Icon = TYPE_ICONS[slug] ?? TYPE_ICONS.outros!
  const typeLabel = PRODUCT_TYPE_LABELS[slug] ?? slug
  const href = getHref(slug, p.tenantProductId)
  const words = p.productName.split(' ')
  const first = words[0] ?? ''
  const rest = words.slice(1).join(' ')

  return (
    <Link
      href={href}
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_40px_60px_-20px_black/60]"
      style={{ background: 'linear-gradient(160deg, oklch(0.14 0.02 55) 0%, oklch(0.08 0.01 50) 100%)' }}
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(60% 50% at 70% 30%, oklch(0.83 0.10 85 / 0.14), transparent 70%)' }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-7 pt-7">
        <span className="text-[10px] font-semibold uppercase tracking-[.22em] text-white/40">{typeLabel}</span>
        <span className="rounded-full bg-primary/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[.1em] text-primary">
          Popular
        </span>
      </div>

      {/* Icon */}
      <div className="relative mx-7 mt-6 grid h-10 w-10 place-items-center rounded-[10px] bg-white/8">
        <Icon className="h-5 w-5 text-primary/80" />
      </div>

      {/* Visual bars */}
      <div className="relative mx-7 mt-7 flex flex-col gap-1.5">
        <div className="h-[4px] w-[130px] rounded-full bg-primary" />
        <div className="h-[4px] w-[85px] rounded-full bg-primary/40" />
        <div className="h-[4px] w-[55px] rounded-full bg-primary/22" />
      </div>

      {/* Name + description */}
      <div className="relative px-7 pt-7 pb-2">
        <h3 className="text-[30px] font-light leading-tight tracking-tight text-white">
          {first}{' '}
          <em className="font-serif not-italic text-primary">{rest}</em>
        </h3>
        {p.description && (
          <p className="mt-3 text-[13px] leading-relaxed text-white/45 line-clamp-3">{p.description}</p>
        )}
      </div>

      {/* Metrics */}
      <div className="relative mt-auto grid grid-cols-2 gap-4 border-t border-white/10 mx-7 pt-5 pb-0">
        {p.minRate != null && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">A.M. a partir de</div>
            <div className="mt-1 text-2xl font-semibold text-primary">{p.minRate.toFixed(2).replace('.', ',')}%</div>
          </div>
        )}
        {p.maxAmount != null && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">Limite até</div>
            <div className="mt-1 text-2xl font-semibold text-white">{formatCurrency(p.maxAmount)}</div>
          </div>
        )}
        {p.maxTermMonths != null && p.maxAmount == null && (
          <div>
            <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-white/30">Prazo até</div>
            <div className="mt-1 text-2xl font-semibold text-white">{p.maxTermMonths} meses</div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative flex items-center justify-between px-7 py-5 mt-5">
        <span className="text-sm font-semibold text-primary">Simular condições</span>
        <ArrowRight className="h-4 w-4 text-primary transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

function ZpRegularCard({ p }: { p: TemplateHomeProduct }) {
  const slug = p.productTypeSlug ?? 'outros'
  const Icon = TYPE_ICONS[slug] ?? TYPE_ICONS.outros!
  const typeLabel = PRODUCT_TYPE_LABELS[slug] ?? slug
  const href = getHref(slug, p.tenantProductId)

  return (
    <Link
      href={href}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[#e8e0d4] bg-white transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_20px_40px_-15px_oklch(0.12_0.01_50/10%)]"
    >
      {/* Header */}
      <div className="px-6 pt-6">
        <span className="text-[9px] font-semibold uppercase tracking-[.22em] text-foreground/40">{typeLabel}</span>
      </div>

      {/* Icon */}
      <div className="mx-6 mt-4 grid h-10 w-10 place-items-center rounded-[10px] bg-foreground/[0.06]">
        <Icon className="h-5 w-5 text-foreground/50" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pt-5 pb-0">
        <h3 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
          {p.productName}
        </h3>
        {p.description && (
          <p className="mt-2 text-sm leading-relaxed text-foreground/55 line-clamp-2">{p.description}</p>
        )}

        {/* Metrics */}
        <div className="mt-auto grid grid-cols-2 gap-4 border-t border-foreground/10 pt-4 mt-5 pb-0">
          {p.minRate != null && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-foreground/38">A.M. a partir de</div>
              <div className="mt-1 text-lg font-semibold text-primary">{p.minRate.toFixed(2).replace('.', ',')}%</div>
            </div>
          )}
          {p.maxAmount != null && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-foreground/38">Até</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(p.maxAmount)}</div>
            </div>
          )}
          {p.maxTermMonths != null && p.maxAmount == null && p.minRate == null && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-[.18em] text-foreground/38">Prazo até</div>
              <div className="mt-1 text-lg font-semibold text-foreground">{p.maxTermMonths} meses</div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-foreground/[0.08] px-6 py-4 mt-5">
        <span className="text-[13px] font-semibold text-foreground/60">Simular condições</span>
        <ArrowRight className="h-4 w-4 text-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-foreground/70" />
      </div>
    </Link>
  )
}

type Props = { products: TemplateHomeProduct[] }

export function ProductsSection({ products }: Props) {
  const [activeFilter, setActiveFilter] = useState('todos')

  const types = Array.from(new Set(products.map((p) => p.productTypeSlug ?? 'outros')))
  const filtered =
    activeFilter === 'todos'
      ? products
      : products.filter((p) => (p.productTypeSlug ?? 'outros') === activeFilter)

  const popular = filtered.filter((p) => p.isPopular)
  const regular = filtered.filter((p) => !p.isPopular)

  const tabClass = (active: boolean) =>
    cn(
      'rounded-full border px-6 py-2.5 text-xs font-medium transition-all',
      active
        ? 'border-surface-foreground bg-surface-foreground text-white'
        : 'border-surface-foreground/12 text-surface-foreground/62 hover:text-surface-foreground',
    )

  return (
    <section id="produtos" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-8">
        {/* Section header */}
        <div className="mb-12 flex items-end justify-between gap-12 max-lg:flex-col max-lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/4 px-3.5 py-2 text-[11px] font-medium uppercase tracking-[.22em] text-surface-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
              Catálogo de crédito
            </span>
            <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-surface-foreground max-lg:text-5xl max-sm:text-4xl">
              Produtos de empréstimo
              <br />
              <em className="font-serif text-6xl italic font-normal text-[oklch(0.48_0.07_50)]">
                desenhados para sua jornada.
              </em>
            </h2>
          </div>
          <p className="max-w-[420px] text-[15px] leading-relaxed text-surface-foreground/62">
            Linhas distintas, do consignado ao crédito com garantia. Toque em qualquer
            produto para simular e ver sua parcela em tempo real.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-8 flex flex-wrap gap-2.5">
          <button type="button" onClick={() => setActiveFilter('todos')} className={tabClass(activeFilter === 'todos')}>
            Todos os produtos{' '}
            <span className={cn('ml-2 text-[11px]', activeFilter === 'todos' ? 'opacity-50' : 'opacity-40')}>
              {products.length}
            </span>
          </button>
          {types.map((type) => (
            <button key={type} type="button" onClick={() => setActiveFilter(type)} className={tabClass(activeFilter === type)}>
              {PRODUCT_TYPE_LABELS[type] ?? type}
              <span className={cn('ml-2 text-[11px]', activeFilter === type ? 'opacity-50' : 'opacity-40')}>
                {products.filter((p) => (p.productTypeSlug ?? 'outros') === type).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-surface-foreground/50">Nenhum produto disponível no momento.</p>
        ) : (
          <div className="flex flex-col gap-[18px]">
            {/* Popular + primeiros regulares no layout assimétrico */}
            {popular.length > 0 && (
              <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
                {/* Featured popular — span 2 rows */}
                <div className={cn(regular.length > 0 ? 'row-span-2 max-lg:row-span-1' : '')}>
                  <ZpFeaturedCard p={popular[0]!} />
                </div>
                {/* Primeiros 2 regulares ao lado do popular */}
                {regular.slice(0, 2).map((p) => (
                  <ZpRegularCard key={p.tenantProductId} p={p} />
                ))}
                {/* Populares adicionais (se houver mais de 1) */}
                {popular.slice(1).map((p) => (
                  <ZpFeaturedCard key={p.tenantProductId} p={p} />
                ))}
              </div>
            )}

            {/* Demais produtos regulares */}
            {(() => {
              const remaining = popular.length > 0 ? regular.slice(2) : regular
              if (remaining.length === 0) return null
              return (
                <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
                  {remaining.map((p) => (
                    <ZpRegularCard key={p.tenantProductId} p={p} />
                  ))}
                </div>
              )
            })()}

            {/* Fallback: nenhum produto popular — grade simples */}
            {popular.length === 0 && (
              <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
                {filtered.map((p) => (
                  <ZpRegularCard key={p.tenantProductId} p={p} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

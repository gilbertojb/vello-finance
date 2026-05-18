'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import type { TemplateHomeProduct } from '@/templates/_types'

import {
  PRODUCT_TYPE_LABELS,
  TYPE_ICONS,
} from '@/app/(store)/_components/product-card'

import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils/simulator'

const CATEGORY_LABELS: Record<string, string> = {
  pessoa_fisica: 'Pessoa Física',
  pessoa_juridica: 'Pessoa Jurídica',
  financiamentos: 'Financiamentos',
}

const CATEGORY_ORDER = ['pessoa_fisica', 'pessoa_juridica', 'financiamentos']

const SLUG_TO_SIMULATOR: Record<string, string> = {
  fgts: '/contratar/fgts',
  consignado_privado: '/contratar/consignado-clt',
  consignado_publico: '/contratar/consignado-clt',
  home_equity: '/simulador/pessoa-fisica/imovel-em-garantia',
  auto_equity: '/simulador/pessoa-fisica/veiculo-em-garantia',
  emprestimo_pessoal: '/simulador/pessoa-fisica/emprestimo-pessoal',
  conta_luz: '/simulador/pessoa-fisica/conta-de-luz',
  home_equity_pj: '/simulador/pessoa-juridica/imovel-em-garantia',
  auto_equity_pj: '/simulador/pessoa-juridica/veiculo-em-garantia',
  capital_giro: '/simulador/pessoa-juridica/capital-de-giro',
  antecipacao_recebiveis: '/simulador/pessoa-juridica/antecipacao-recebiveis',
  financiamento_imovel: '/simulador/financiamentos/imovel',
  financiamento_veiculo: '/simulador/financiamentos/veiculo',
}

const HAS_DEDICATED_SIMULATOR = new Set([
  'fgts',
  'consignado_privado',
  'consignado_publico',
  'home_equity',
  'auto_equity',
  'emprestimo_pessoal',
  'conta_luz',
  'home_equity_pj',
  'auto_equity_pj',
  'capital_giro',
  'antecipacao_recebiveis',
  'financiamento_imovel',
  'financiamento_veiculo',
])

function getHref(slug: string | null, tenantProductId: string): string {
  const s = slug ?? 'outros'
  const base = SLUG_TO_SIMULATOR[s] ?? '/simulador'
  return HAS_DEDICATED_SIMULATOR.has(s)
    ? `${base}?productId=${tenantProductId}`
    : base
}

function abbrev(value: number): string {
  if (value >= 1_000_000) {
    const n = value / 1_000_000
    return `R$ ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}M`
  }
  if (value >= 1_000) {
    const n = value / 1_000
    return `R$ ${n % 1 === 0 ? n.toFixed(0) : n.toFixed(1)}k`
  }
  return formatCurrency(value)
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
      className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_40px_60px_-20px_black/60] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
      style={{
        background:
          'linear-gradient(160deg, oklch(0.14 0.02 55) 0%, oklch(0.08 0.01 50) 100%)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(60% 50% at 70% 30%, oklch(0.83 0.10 85 / 0.14), transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-7 pt-7">
        <span className="text-2xs font-semibold uppercase tracking-label text-white/40">
          {typeLabel}
        </span>
        <span className="rounded-full bg-primary/20 px-3 py-1 text-2xs font-bold uppercase tracking-widest text-primary">
          Popular
        </span>
      </div>

      {/* Icon */}
      <div className="relative mx-7 mt-6 grid h-10 w-10 place-items-center rounded-xl bg-white/10">
        <Icon className="h-5 w-5 text-primary/80" />
      </div>

      {/* Name + description */}
      <div className="relative px-7 pb-2 pt-7">
        <h3 className="text-3xl font-light leading-tight tracking-tight text-white">
          {first} <em className="font-serif not-italic text-primary">{rest}</em>
        </h3>
        {p.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/45">
            {p.description}
          </p>
        )}
      </div>

      {/* Metrics */}
      <div className="relative mx-7 mt-auto grid grid-cols-2 gap-4 border-t border-white/10 pb-0 pt-5">
        {p.minRate != null && (
          <div>
            <div className="text-2xs font-semibold uppercase tracking-data text-white/30">
              Taxa ao mês
            </div>
            <div className="mt-1 text-2xl font-semibold text-primary">
              {p.minRate.toFixed(2).replace('.', ',')}%
            </div>
          </div>
        )}
        {p.maxAmount != null && (
          <div>
            <div className="text-2xs font-semibold uppercase tracking-data text-white/30">
              Até
            </div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {abbrev(p.maxAmount)}
            </div>
          </div>
        )}
        {p.maxTermMonths != null && p.maxAmount == null && (
          <div>
            <div className="text-2xs font-semibold uppercase tracking-data text-white/30">
              Prazo até
            </div>
            <div className="mt-1 text-2xl font-semibold text-white">
              {p.maxTermMonths} meses
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative mt-5 flex items-center justify-between px-7 py-5">
        <span className="text-sm font-semibold text-primary">
          Simular condições
        </span>
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
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-surface-foreground/15 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-surface-foreground/25 hover:shadow-[0_20px_40px_-15px_oklch(0.12_0.01_50/10%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-surface-foreground/40 focus-visible:ring-offset-2"
    >
      {/* Header */}
      <div className="px-6 pt-6">
        <span className="text-2xs font-semibold uppercase tracking-label text-surface-foreground/40">
          {typeLabel}
        </span>
      </div>

      {/* Icon */}
      <div className="mx-6 mt-4 grid h-10 w-10 place-items-center rounded-xl bg-surface-foreground/5">
        <Icon className="h-5 w-5 text-surface-foreground/50" />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col px-6 pb-0 pt-5">
        <h3 className="text-xl font-bold leading-tight tracking-tight text-surface-foreground">
          {p.productName}
        </h3>
        {p.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-surface-foreground/55">
            {p.description}
          </p>
        )}

        {/* Metrics */}
        <div className="mt-auto grid grid-cols-2 gap-4 border-t border-surface-foreground/10 pt-4 mt-5">
          {p.minRate != null && (
            <div>
              <div className="text-2xs font-semibold uppercase tracking-data text-surface-foreground/40">
                Taxa ao mês
              </div>
              <div className="mt-1 text-lg font-semibold text-primary">
                {p.minRate.toFixed(2).replace('.', ',')}%
              </div>
            </div>
          )}
          {p.maxAmount != null && (
            <div>
              <div className="text-2xs font-semibold uppercase tracking-data text-surface-foreground/40">
                Até
              </div>
              <div className="mt-1 text-lg font-semibold text-surface-foreground">
                {abbrev(p.maxAmount)}
              </div>
            </div>
          )}
          {p.maxTermMonths != null &&
            p.maxAmount == null &&
            p.minRate == null && (
              <div>
                <div className="text-2xs font-semibold uppercase tracking-data text-surface-foreground/40">
                  Prazo até
                </div>
                <div className="mt-1 text-lg font-semibold text-surface-foreground">
                  {p.maxTermMonths} meses
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between border-t border-surface-foreground/10 px-6 py-4">
        <span className="text-sm font-semibold text-surface-foreground/60">
          Simular condições
        </span>
        <ArrowRight className="h-4 w-4 text-surface-foreground/40 transition-transform group-hover:translate-x-1 group-hover:text-surface-foreground/70" />
      </div>
    </Link>
  )
}

type Props = { products: TemplateHomeProduct[] }

export function ProductsSection({ products }: Props) {
  const [activeFilter, setActiveFilter] = useState('todos')

  const categories = CATEGORY_ORDER.filter((cat) =>
    products.some((p) => p.category === cat),
  )

  const filtered =
    activeFilter === 'todos'
      ? products
      : products.filter((p) => p.category === activeFilter)

  const tabClass = (active: boolean) =>
    cn(
      'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
      active
        ? 'border-surface-foreground bg-surface-foreground text-white'
        : 'border-surface-foreground/15 text-surface-foreground/60 hover:border-surface-foreground/30 hover:text-surface-foreground',
    )

  return (
    <section id="produtos" className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-8">
        {/* Section header */}
        <div className="mb-12 flex items-end justify-between gap-12 max-lg:flex-col max-lg:items-start">
          <div>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-surface-foreground/20 bg-surface-foreground/5 px-3.5 py-2 text-2xs font-medium uppercase tracking-label text-surface-foreground/60">
              <span className="h-1.5 w-1.5 rounded-full bg-surface-foreground/40" />
              Catálogo de crédito
            </span>
            <h2 className="mt-4 text-5xl font-light leading-none tracking-tight text-surface-foreground max-sm:text-4xl">
              Produtos de empréstimo
              <br />
              <em className="font-serif text-6xl italic font-normal text-accent-olive">
                desenhados para sua jornada.
              </em>
            </h2>
          </div>
          <p className="max-w-sm text-base leading-relaxed text-surface-foreground/60 max-lg:max-w-none">
            Linhas distintas, do consignado ao crédito com garantia. Toque em
            qualquer produto para simular e ver sua parcela em tempo real.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('todos')}
            className={tabClass(activeFilter === 'todos')}
          >
            Todos os produtos
            <span
              className={cn(
                'text-xs',
                activeFilter === 'todos' ? 'opacity-60' : 'opacity-50',
              )}
            >
              {products.length}
            </span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveFilter(cat)}
              className={tabClass(activeFilter === cat)}
            >
              {CATEGORY_LABELS[cat] ?? cat}
              <span
                className={cn(
                  'text-xs',
                  activeFilter === cat ? 'opacity-60' : 'opacity-50',
                )}
              >
                {products.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base text-surface-foreground/50">
              Nenhum produto disponível no momento.
            </p>
            <p className="mt-1 text-sm text-surface-foreground/35">
              Entre em contato para saber mais.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {[
              ...filtered.filter((p) => p.isPopular),
              ...filtered.filter((p) => !p.isPopular),
            ].map((p) =>
              p.isPopular ? (
                <div
                  key={p.tenantProductId}
                  className="row-span-2 max-lg:row-span-1"
                >
                  <ZpFeaturedCard p={p} />
                </div>
              ) : (
                <ZpRegularCard key={p.tenantProductId} p={p} />
              ),
            )}
          </div>
        )}
      </div>
    </section>
  )
}

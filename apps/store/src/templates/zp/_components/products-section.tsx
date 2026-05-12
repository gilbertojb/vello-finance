'use client'

import { useState } from 'react'

import { ProductCard } from '@/app/(store)/_components/product-card'
import { cn } from '@/lib/utils'

import type { TemplateHomeProduct } from '@/templates/_types'

const TYPE_LABELS: Record<string, string> = {
  fgts: 'FGTS',
  consignado_publico: 'Consignado Público',
  consignado_privado: 'Consignado Privado',
  home_equity: 'Home Equity',
  auto_equity: 'Auto Equity',
  outros: 'Outros',
}

type Props = { products: TemplateHomeProduct[] }

export function ProductsSection({ products }: Props) {
  const [activeFilter, setActiveFilter] = useState('todos')

  const types = Array.from(
    new Set(products.map((p) => p.productTypeSlug ?? 'outros')),
  )
  const filtered =
    activeFilter === 'todos'
      ? products
      : products.filter((p) => (p.productTypeSlug ?? 'outros') === activeFilter)

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
            Linhas distintas, do consignado ao home equity. Toque em qualquer
            produto para simular e ver sua parcela em tempo real.
          </p>
        </div>

        <div className="mb-8 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => setActiveFilter('todos')}
            className={tabClass(activeFilter === 'todos')}
          >
            Todos os produtos{' '}
            <span
              className={cn(
                'ml-2 text-[11px]',
                activeFilter === 'todos' ? 'opacity-50' : 'opacity-40',
              )}
            >
              {products.length}
            </span>
          </button>
          {types.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveFilter(type)}
              className={tabClass(activeFilter === type)}
            >
              {TYPE_LABELS[type] ?? type}
              <span
                className={cn(
                  'ml-2 text-xs',
                  activeFilter === type ? 'opacity-50' : 'opacity-40',
                )}
              >
                {
                  products.filter(
                    (p) => (p.productTypeSlug ?? 'outros') === type,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="py-16 text-center text-surface-foreground/50">
            Nenhum produto disponível no momento.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-[18px] max-lg:grid-cols-2 max-sm:grid-cols-1">
            {filtered.map((p, index) => (
              <div
                key={p.tenantProductId}
                className={cn(
                  index === 0 && filtered.length > 1
                    ? 'row-span-2 max-lg:row-span-1'
                    : '',
                )}
              >
                <ProductCard
                  tenantProductId={p.tenantProductId}
                  coverUrl={p.coverUrl}
                  productName={p.productName}
                  productTypeSlug={p.productTypeSlug}
                  minAmount={p.minAmount}
                  maxAmount={p.maxAmount}
                  minTermMonths={p.minTermMonths}
                  maxTermMonths={p.maxTermMonths}
                  featured={index === 0 && filtered.length > 1}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ProductCard } from '@/app/(store)/_components/product-card'
import type { TemplateHomeProduct } from '@/templates/_types'

const CATEGORY_LABELS: Record<string, string> = {
  pessoa_fisica:   'Pessoa Física',
  pessoa_juridica: 'Pessoa Jurídica',
  financiamentos:  'Financiamentos',
}

const CATEGORY_ORDER = ['pessoa_fisica', 'pessoa_juridica', 'financiamentos']

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
        ? 'border-surface-foreground bg-surface-foreground text-surface'
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
            <h2 className="mt-5 text-5xl font-light leading-none tracking-tight text-surface-foreground max-sm:text-4xl">
              Produtos de empréstimo
              <br />
              <em className="font-serif not-italic font-normal text-accent-olive">
                desenhados para sua jornada.
              </em>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-surface-foreground/60 max-lg:max-w-none">
            Linhas distintas, do consignado ao crédito com garantia. Toque em qualquer
            produto para simular e ver sua parcela em tempo real.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button type="button" onClick={() => setActiveFilter('todos')} className={tabClass(activeFilter === 'todos')}>
            Todos os produtos
            <span className={cn('text-xs', activeFilter === 'todos' ? 'opacity-60' : 'opacity-50')}>
              {products.length}
            </span>
          </button>
          {categories.map((cat) => (
            <button key={cat} type="button" onClick={() => setActiveFilter(cat)} className={tabClass(activeFilter === cat)}>
              {CATEGORY_LABELS[cat] ?? cat}
              <span className={cn('text-xs', activeFilter === cat ? 'opacity-60' : 'opacity-50')}>
                {products.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-base text-surface-foreground/50">Nenhum produto disponível no momento.</p>
            <p className="mt-1 text-sm text-surface-foreground/35">Entre em contato para saber mais.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {filtered.map((p, index) => {
              const isFeatured = p.isPopular && index === 0 && filtered.length > 1
              return (
                <div
                  key={p.tenantProductId}
                  className={cn(isFeatured ? 'row-span-2 max-lg:row-span-1' : '')}
                >
                  <ProductCard
                    tenantProductId={p.tenantProductId}
                    coverUrl={p.coverUrl}
                    productName={p.productName}
                    description={p.description}
                    productTypeSlug={p.productTypeSlug}
                    minAmount={p.minAmount}
                    maxAmount={p.maxAmount}
                    minTermMonths={p.minTermMonths}
                    maxTermMonths={p.maxTermMonths}
                    minRate={p.minRate}
                    isPopular={p.isPopular}
                    featured={isFeatured}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

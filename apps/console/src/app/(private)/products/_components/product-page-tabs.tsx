'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { AvailableProducts } from './available-products'
import { ProductList } from './product-list'
import type { ProductRow, TenantProductRow } from '../queries'

interface ProductPageTabsProps {
  tenantProducts: TenantProductRow[]
  availableProducts: ProductRow[]
}

export function ProductPageTabs({ tenantProducts, availableProducts }: ProductPageTabsProps) {
  const [tab, setTab] = useState<'portfolio' | 'available'>('portfolio')

  const available = availableProducts.filter(
    (p) => !tenantProducts.some((tp) => tp.products?.id === p.id),
  )

  const tabBtn = (active: boolean) =>
    cn(
      'relative px-4 py-2.5 text-sm font-medium transition-colors',
      active
        ? 'text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
        : 'text-foreground/45 hover:text-foreground/70',
    )

  return (
    <div>
      <div className="mb-6 flex gap-1 border-b border-border/60">
        <button
          type="button"
          className={tabBtn(tab === 'portfolio')}
          onClick={() => setTab('portfolio')}
        >
          Meus Produtos
          <span className={cn('ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold', tab === 'portfolio' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/40')}>
            {tenantProducts.length}
          </span>
        </button>
        <button
          type="button"
          className={tabBtn(tab === 'available')}
          onClick={() => setTab('available')}
        >
          Produtos Disponíveis
          {available.length > 0 && (
            <span className={cn('ml-2 rounded-full px-1.5 py-0.5 text-[11px] font-semibold', tab === 'available' ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground/40')}>
              {available.length}
            </span>
          )}
        </button>
      </div>

      {tab === 'portfolio' && <ProductList products={tenantProducts} />}
      {tab === 'available' && (
        <AvailableProducts
          products={availableProducts}
          tenantProducts={tenantProducts}
        />
      )}
    </div>
  )
}

import { StoreHeader } from '@/app/(store)/_components/store-header'
import { StoreFooter } from '@/app/(store)/_components/store-footer'
import type { TemplateHomeProps } from '@/templates/_types'

import { CtaBanner }       from './_components/cta-banner'
import { HeroSection }     from './_components/hero-section'
import { HowItWorks }      from './_components/how-it-works'
import { ProductsSection } from './_components/products-section'

export function DefaultHome({ displayName, logoUrl, products }: TemplateHomeProps) {
  const featuredProductId = products[0]?.tenantProductId ?? null
  const minRate           = products[0]?.minRate ?? null

  return (
    <div className="flex min-h-svh flex-col">
      <StoreHeader logoUrl={logoUrl} displayName={displayName} />
      <main className="flex-1">
        <HeroSection
          displayName={displayName}
          featuredProductId={featuredProductId}
          minRate={minRate}
        />
        <ProductsSection products={products} />
        <HowItWorks />
        <CtaBanner featuredProductId={featuredProductId} />
      </main>
      <StoreFooter displayName={displayName} logoUrl={logoUrl} />
    </div>
  )
}

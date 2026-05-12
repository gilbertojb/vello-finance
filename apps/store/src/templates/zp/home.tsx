import type { TemplateHomeProps } from '@/templates/_types'

import { CtaBanner } from './_components/cta-banner'
import { ZpFooter } from './_components/footer'
import { ZpHeader } from './_components/header'
import { HeroSection } from './_components/hero-section'
import { HowItWorks } from './_components/how-it-works'
import { ProductsSection } from './_components/products-section'

export function ZpHome({ displayName, logoUrl, products }: TemplateHomeProps) {
  const featuredProductId = products[0]?.tenantProductId ?? null
  const minRate = products[0]?.minRate ?? null

  return (
    <div className="flex min-h-svh flex-col">
      <ZpHeader logoUrl={logoUrl} displayName={displayName} />
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
      <ZpFooter displayName={displayName} logoUrl={logoUrl} />
    </div>
  )
}

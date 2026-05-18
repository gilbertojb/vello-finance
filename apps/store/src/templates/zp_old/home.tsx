import type { Metadata } from 'next'

import { TenantLogo } from '@/components/tenant-logo'
import type { TemplateHomeProps } from '@/templates/_types'

import { CtaBanner } from './_components/cta-banner'
import { ZpFooter } from './_components/footer'
import { ZpHeader } from './_components/header'
import { HeroSection } from './_components/hero-section'
import { HowItWorks } from './_components/how-it-works'
import { ProductsSection } from './_components/products-section'

export const metadata: Metadata = { title: 'Crédito feito para você' }

export function ZpOldHome({ displayName, logoUrl, products }: TemplateHomeProps) {
  const name = displayName ?? 'ZP Pay'
  const featuredProductId = products[0]?.tenantProductId ?? null
  const minRate = products[0]?.minRate ?? null
  const logoSlot = logoUrl
    ? <TenantLogo url={logoUrl} alt={name} width={140} height={40} className="h-10 w-auto" />
    : null

  return (
    <div className="flex min-h-svh flex-col">
      <ZpHeader logoSlot={logoSlot} displayName={displayName} />
      <main className="flex-1">
        <HeroSection displayName={displayName} minRate={minRate} />
        <ProductsSection products={products} />
        <HowItWorks />
        <CtaBanner featuredProductId={featuredProductId} />
      </main>
      <ZpFooter displayName={displayName} logoUrl={logoUrl} />
    </div>
  )
}

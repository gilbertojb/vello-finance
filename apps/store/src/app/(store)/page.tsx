import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTenantBranding } from '@/lib/branding'
import { listActiveProducts } from './queries'
import { HeroSection } from './_components/hero-section'
import { ProductStrip } from './_components/product-strip'
import { ProductsSection } from './_components/products-section'
import { HowItWorks } from './_components/how-it-works'
import { CtaBanner } from './_components/cta-banner'

export const metadata: Metadata = { title: 'Início' }

export default async function HomePage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''

  const [branding, products] = await Promise.all([
    getTenantBranding(tenantId),
    listActiveProducts(tenantId),
  ])

  const validProducts = products.filter((tp) => tp.products != null)
  const featuredProduct = validProducts[0] ?? null
  const featuredProductId = featuredProduct?.id ?? null
  const minRate = featuredProduct?.products?.min_rate_monthly ?? null

  const productList = validProducts.map((tp) => ({
    tenantProductId: tp.id,
    coverUrl: tp.cover_url ?? null,
    productName: tp.products!.name,
    productTypeSlug: (tp.products!.product_type as { slug: string } | null)?.slug ?? null,
    minAmount: tp.products!.min_amount ?? null,
    maxAmount: tp.products!.max_amount ?? null,
    minTermMonths: tp.products!.min_term_months ?? null,
    maxTermMonths: tp.products!.max_term_months ?? null,
  }))

  const chipList = validProducts.map((tp) => ({
    id: tp.id,
    typeSlug: (tp.products!.product_type as { slug: string } | null)?.slug ?? 'outros',
    rate: tp.products!.min_rate_monthly ?? null,
  }))

  return (
    <>
      <HeroSection
        displayName={branding?.company_display_name ?? null}
        featuredProductId={featuredProductId}
        minRate={minRate}
      />
      <ProductStrip products={chipList} />
      <ProductsSection products={productList} />
      <HowItWorks />
      <CtaBanner featuredProductId={featuredProductId} />
    </>
  )
}

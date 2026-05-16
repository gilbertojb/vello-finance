import { headers } from 'next/headers'

import { listActiveProducts } from '@/app/(store)/queries'
import { getTenantBranding } from '@/lib/branding'
import { getHomeComponent } from '@/templates'

export default async function HomePage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''

  const [branding, rawProducts] = await Promise.all([
    getTenantBranding(tenantId),
    listActiveProducts(tenantId),
  ])

  const products = rawProducts
    .filter((tp) => tp.products != null)
    .map((tp) => ({
      tenantProductId: tp.id,
      coverUrl: tp.cover_url ?? null,
      productName: tp.products!.name,
      description: tp.products!.description ?? null,
      productTypeSlug:
        (tp.products!.product_type as { slug: string } | null)?.slug ?? null,
      minAmount: tp.products!.min_amount ?? null,
      maxAmount: tp.products!.max_amount ?? null,
      minTermMonths: tp.products!.min_term_months ?? null,
      maxTermMonths: tp.products!.max_term_months ?? null,
      minRate: tp.products!.min_rate_monthly ?? null,
      isPopular: tp.is_popular ?? false,
    }))

  const HomeComponent = getHomeComponent(branding?.template_id)

  return (
    <HomeComponent
      displayName={branding?.company_display_name ?? null}
      logoUrl={branding?.logo_url ?? null}
      products={products}
    />
  )
}

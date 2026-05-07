import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { getTenantBranding } from '@/lib/branding'
import { listActiveProducts } from './queries'
import { HeroSection } from './_components/hero-section'
import { ProductCard } from './_components/product-card'
import { ValueProps } from './_components/value-props'

export const metadata: Metadata = { title: 'Início' }

export default async function HomePage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''

  const [branding, products] = await Promise.all([
    getTenantBranding(tenantId),
    listActiveProducts(tenantId),
  ])

  return (
    <>
      <HeroSection
        displayName={branding?.company_display_name ?? null}
        bgImageUrl={branding?.auth_bg_image_url ?? null}
      />

      <section id="produtos" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              Produtos disponíveis
            </h2>
            <p className="mt-2 text-muted-foreground">
              Escolha o produto ideal para o seu perfil e simule agora.
            </p>
          </div>

          {products.length === 0 ? (
            <p className="text-center text-muted-foreground py-16">
              Nenhum produto disponível no momento.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((tp) => {
                if (!tp.products) return null
                return (
                  <ProductCard
                    key={tp.id}
                    tenantProductId={tp.id}
                    coverUrl={tp.cover_url ?? null}
                    productName={tp.products.name}
                    productTypeSlug={(tp.products.product_type as { slug: string } | null)?.slug ?? null}
                    minAmount={tp.products.min_amount ?? null}
                    maxAmount={tp.products.max_amount ?? null}
                    minTermMonths={tp.products.min_term_months ?? null}
                    maxTermMonths={tp.products.max_term_months ?? null}
                  />
                )
              })}
            </div>
          )}
        </div>
      </section>

      <ValueProps displayName={branding?.company_display_name ?? null} />
    </>
  )
}

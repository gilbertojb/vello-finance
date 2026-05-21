import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { getSimulation, getTenantProductByProductId } from '../../queries'
import { DB_TO_URL_SLUG, PRODUCT_FLOWS } from '../../contratar/[productTypeSlug]/_components/flow-config'

export const metadata: Metadata = { title: 'Solicitação recebida' }

type Props = { params: Promise<{ id: string }> }

export default async function AgradecimentoPage({ params }: Props) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const simulation = await getSimulation(id, tenantId)

  const productName = (simulation?.products as { name: string } | null)?.name ?? 'Crédito'
  const clientName = simulation?.client_name

  const productTypeSlug = (simulation?.products as { product_type?: { slug?: string } } | null)?.product_type?.slug ?? null
  const productId = simulation?.product_id ?? null

  let contratarHref: string | null = null
  if (productTypeSlug && productId) {
    const tenantProduct = await getTenantProductByProductId(productId, tenantId)
    const urlSlug = DB_TO_URL_SLUG[productTypeSlug]
    const firstStep = PRODUCT_FLOWS[productTypeSlug]?.etapa1[0]?.slug
    if (tenantProduct && urlSlug && firstStep) {
      contratarHref = `/contratar/${urlSlug}?step=${firstStep}&productId=${tenantProduct.id}&simulationId=${id}`
    }
  }

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <div className="rounded-2xl border border-foreground/[0.06] bg-white p-10 text-center max-sm:p-6">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-14 w-14 text-success" />
          </div>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground">
            {productName}
          </span>
          <h2 className="mb-3 mt-5 text-2xl font-bold leading-tight tracking-tight text-surface-foreground">
            Recebemos seu interesse!
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/60">
            {clientName ? (
              <>
                Olá, <strong className="text-surface-foreground">{clientName}</strong>!{' '}
              </>
            ) : null}
            Um de nossos consultores vai entrar em contato pelo seu WhatsApp em breve para
            dar continuidade à sua solicitação de <strong>{productName}</strong>.
          </p>
          <div className="flex flex-col items-center gap-3">
            {contratarHref && (
              <Link
                href={contratarHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continuar com a contratação
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center rounded-2xl bg-background px-6 py-3.5 text-sm font-semibold text-primary transition-opacity hover:opacity-90"
            >
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

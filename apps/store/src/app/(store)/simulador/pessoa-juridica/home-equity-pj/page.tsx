import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTenantProduct } from '../../../queries'
import { SimuladorStepIndicator } from '../../../_components/simulador-step-indicator'
import { HomeEquityForm } from '../../pessoa-fisica/home-equity/_components/home-equity-form'

export const metadata: Metadata = { title: 'Empréstimo com Garantia de Imóvel PJ' }

type Props = { searchParams: Promise<{ productId?: string }> }

export default async function HomeEquityPjDadosPage({ searchParams }: Props) {
  const sp = await searchParams
  const { productId } = sp

  if (!productId) notFound()

  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(productId, tenantId)
  if (!tp || !tp.products) notFound()

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <Link
          href="/simulador/pessoa-juridica"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-foreground/55 transition-colors hover:text-surface-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>

        <div className="mb-10">
          <SimuladorStepIndicator currentStep={2} />
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-10 max-sm:p-6">
          <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.03_85)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[oklch(0.48_0.07_50)]">
            {tp.products.name}
          </span>

          <h2 className="mb-2 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Preencha os dados abaixo
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/55">
            A simulação é 100% gratuita, segura e sem compromisso. Leva menos de 1 minuto.
          </p>

          <HomeEquityForm
            productId={productId}
            isPj={true}
            minTermMonths={tp.products.min_term_months ?? 12}
            maxTermMonths={tp.products.max_term_months ?? 240}
            maxAmount={tp.products.max_amount ?? undefined}
            minAmount={tp.products.min_amount ?? 150000}
          />
        </div>
      </div>
    </div>
  )
}

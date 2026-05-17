import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTenantProduct } from '@/app/(store)/simulador/queries'
import { SimulatorStepIndicator } from '@/app/(store)/simulador/_components/simulator-step-indicator'
import { ConsignadoResultado } from './_components/consignado-resultado'

export const metadata: Metadata = { title: 'Sua simulação está pronta' }

type Props = { searchParams: Promise<{ productId?: string }> }

export default async function ConsignadoResultadoPage({ searchParams }: Props) {
  const sp = await searchParams
  const { productId } = sp
  if (!productId) notFound()

  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(productId, tenantId)
  if (!tp || !tp.products) notFound()

  const rate = tp.products.min_rate_monthly ?? 1.5

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <Link
          href={`/simulador/pessoa-fisica/consignado?productId=${productId}`}
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-foreground/55 transition-colors hover:text-surface-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>

        <div className="mb-10">
          <SimulatorStepIndicator currentStep={3} />
        </div>

        <div className="rounded-2xl border border-foreground/[0.06] bg-background p-10 max-sm:p-6">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground">
            Simulação Concluída
          </span>

          <h2 className="mb-2 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Sua simulação está pronta!
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/55">
            {tp.products.name} · Confira os detalhes abaixo.
          </p>

          <ConsignadoResultado
            productId={productId}
            productName={tp.products.name}
            rateMonthly={rate}
            minTermMonths={tp.products.min_term_months ?? 12}
            maxTermMonths={tp.products.max_term_months ?? 96}
          />
        </div>
      </div>
    </div>
  )
}

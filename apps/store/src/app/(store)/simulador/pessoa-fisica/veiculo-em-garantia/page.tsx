import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTenantProduct } from '@/app/(store)/queries'
import { SimulatorStepIndicator } from '@/app/(store)/_components/simulator-step-indicator'
import { AutoEquityForm } from './_components/auto-equity-form'

export const metadata: Metadata = { title: 'Empréstimo com Garantia de Veículo' }

type Props = { searchParams: Promise<{ productId?: string }> }

export default async function AutoEquityDadosPage({ searchParams }: Props) {
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
          href="/simulador/pessoa-fisica"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-foreground/55 transition-colors hover:text-surface-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>

        <div className="mb-10">
          <SimulatorStepIndicator currentStep={2} />
        </div>

        <div className="rounded-2xl border border-surface-foreground/10 bg-white p-10 max-sm:p-6">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground">
            {tp.products.name}
          </span>

          <h2 className="mb-2 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Preencha os dados abaixo
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/55">
            A simulação é 100% gratuita, segura e sem compromisso. Leva menos de 1 minuto.
          </p>

          <AutoEquityForm
            productId={productId}
            minTermMonths={tp.products.min_term_months ?? 12}
            maxTermMonths={tp.products.max_term_months ?? 90}
            maxAmount={tp.products.max_amount ?? undefined}
            minAmount={tp.products.min_amount ?? 10000}
          />
        </div>
      </div>
    </div>
  )
}

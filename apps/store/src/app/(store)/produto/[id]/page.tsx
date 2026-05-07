import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { generateTermOptions } from '@/lib/utils/simulator'
import { getTenantProduct } from '../../queries'
import { SimulatorPanel } from './_components/simulator-panel'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ amount?: string; term?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(id, tenantId)
  return { title: tp?.products?.name ?? 'Simulador' }
}

export default async function SimulatorPage({ params, searchParams }: Props) {
  const { id } = await params
  const { amount: amountParam, term: termParam } = await searchParams

  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const tp = await getTenantProduct(id, tenantId)

  if (!tp || !tp.products) notFound()

  const { products: p } = tp
  const minAmount = p.min_amount ?? 1000
  const maxAmount = p.max_amount ?? 100000
  const minTerm = p.min_term_months ?? 12
  const maxTerm = p.max_term_months ?? 60
  const minRate = p.min_rate_monthly ?? 0

  const termOptions = generateTermOptions(minTerm, maxTerm)

  const initialAmount = Math.min(
    maxAmount,
    Math.max(minAmount, Number(amountParam) || minAmount),
  )
  const initialTerm = termOptions.includes(Number(termParam))
    ? Number(termParam)
    : termOptions[0]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Coluna esquerda — info do produto */}
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Simulador
          </p>
          <h1 className="mb-4 text-3xl font-bold text-foreground">{p.name}</h1>
          {p.description && (
            <p className="text-muted-foreground leading-relaxed">{p.description}</p>
          )}
        </div>

        {/* Coluna direita — painel interativo */}
        <SimulatorPanel
          tenantProductId={id}
          minAmount={minAmount}
          maxAmount={maxAmount}
          termOptions={termOptions}
          minRate={minRate}
          initialAmount={initialAmount}
          initialTerm={initialTerm}
        />
      </div>
    </div>
  )
}

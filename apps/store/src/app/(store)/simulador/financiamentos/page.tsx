import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listActiveProductsByCategory } from '@/app/(store)/queries'
import { ProdutoSelector } from '@/app/(store)/_components/produto-selector'
import { SimulatorStepIndicator } from '@/app/(store)/_components/simulator-step-indicator'

export const metadata: Metadata = { title: 'Financiamentos' }

const SLUG_TO_ROUTE: Record<string, string> = {
  financiamento_imovel:  '/simulador/financiamentos/imovel',
  financiamento_veiculo: '/simulador/financiamentos/veiculo',
}

export default async function FinanciamentosPage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const products = await listActiveProductsByCategory(tenantId, 'financiamentos')

  const options = products.map((tp) => {
    const slug = (tp.products!.product_type as { slug: string }).slug
    const route = SLUG_TO_ROUTE[slug] ?? '/simulador/financiamentos'
    return {
      tenantProductId: tp.id,
      label: tp.products!.name,
      href: `${route}?productId=${tp.id}`,
    }
  })

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-foreground/55 transition-colors hover:text-surface-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
        <div className="mb-10"><SimulatorStepIndicator currentStep={1} /></div>
        <div className="rounded-2xl border border-surface-foreground/10 bg-white p-10 max-sm:p-6">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-primary-foreground">
            Financiamentos
          </span>
          <h2 className="mb-2 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Qual financiamento você está buscando?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/55">
            Escolha a linha mais adequada para você. Simulação gratuita, sem cadastro e sem compromisso.
          </p>
          <ProdutoSelector options={options} />
        </div>
      </div>
    </div>
  )
}

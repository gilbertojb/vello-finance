import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listActiveProducts } from '../../queries'
import { ProdutoSelector } from '../../_components/produto-selector'
import { SimuladorStepIndicator } from '../../_components/simulador-step-indicator'

export const metadata: Metadata = { title: 'Crédito Pessoa Física' }

const PESSOA_FISICA_LABELS: Record<string, string> = {
  home_equity: 'Empréstimo com garantia de imóvel',
  auto_equity: 'Empréstimo com garantia de veículo',
  fgts: 'Antecipação de saque FGTS',
  emprestimo_pessoal: 'Empréstimo Pessoal',
  conta_luz: 'Crédito na Conta de Luz',
}

const SLUG_TO_ROUTE: Record<string, string> = {
  home_equity: '/simulador/pessoa-fisica/home-equity',
  auto_equity: '/simulador/pessoa-fisica/auto-equity',
  fgts: '/simulador/pessoa-fisica/fgts',
  emprestimo_pessoal: '/simulador/pessoa-fisica/emprestimo-pessoal',
  conta_luz: '/simulador/pessoa-fisica/conta-luz',
}

export default async function PessoaFisicaPage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const allProducts = await listActiveProducts(tenantId)

  const options = allProducts
    .filter((tp) => {
      const slug = (tp.products?.product_type as { slug: string } | null)?.slug ?? ''
      return slug in PESSOA_FISICA_LABELS
    })
    .map((tp) => {
      const slug = (tp.products!.product_type as { slug: string }).slug
      const route = SLUG_TO_ROUTE[slug] ?? `/produto/${tp.id}`
      return {
        tenantProductId: tp.id,
        label: PESSOA_FISICA_LABELS[slug]!,
        productName: tp.products!.name,
        href: `${route}?productId=${tp.id}`,
      }
    })

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-foreground/55 transition-colors hover:text-surface-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>

        <div className="mb-10">
          <SimuladorStepIndicator currentStep={1} />
        </div>

        <div className="rounded-[22px] border border-black/[0.06] bg-white p-10 max-sm:p-6">
          <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.03_85)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[oklch(0.48_0.07_50)]">
            Crédito Pessoa Física
          </span>

          <h2 className="mb-2 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Qual crédito você está buscando?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/55">
            Escolha o produto mais adequado para você. Simulação gratuita, sem cadastro e sem compromisso.
          </p>

          <ProdutoSelector options={options} />
        </div>
      </div>
    </div>
  )
}

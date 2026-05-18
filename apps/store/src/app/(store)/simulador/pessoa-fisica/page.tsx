import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listActiveProductsByCategory } from '@/app/(store)/queries'
import { ProdutoSelector } from '@/app/(store)/_components/produto-selector'
import { DotsIndicator, SIMULATOR_STEPS } from '@/app/(store)/_components/dots-indicator'

export const metadata: Metadata = { title: 'Crédito Pessoa Física' }

const SLUG_TO_ROUTE: Record<string, string> = {
  home_equity:        '/simulador/pessoa-fisica/imovel-em-garantia',
  auto_equity:        '/simulador/pessoa-fisica/veiculo-em-garantia',
  fgts:               '/contratar/fgts',
  emprestimo_pessoal: '/simulador/pessoa-fisica/emprestimo-pessoal',
  conta_luz:          '/simulador/pessoa-fisica/conta-de-luz',
  consignado_privado: '/contratar/consignado-clt',
  consignado_publico: '/contratar/consignado-clt',
}

export default async function PessoaFisicaPage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const products = await listActiveProductsByCategory(tenantId, 'pessoa_fisica')

  const options = products.map((tp) => {
    const slug = (tp.products!.product_type as { slug: string }).slug
    const route = SLUG_TO_ROUTE[slug] ?? '/simulador/pessoa-fisica'
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
        <DotsIndicator steps={SIMULATOR_STEPS} currentStep="produto" />
        <div className="rounded-2xl border border-surface-foreground/10 bg-white p-6 max-sm:p-5">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-label text-primary-foreground">
            Crédito Pessoa Física
          </span>
          <h2 className="mb-2 mt-5 text-2xl font-bold leading-tight tracking-tight text-surface-foreground">
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

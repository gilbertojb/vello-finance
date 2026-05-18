import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getTenantProduct, getProposal } from '@/app/(store)/queries'
import { URL_TO_DB_SLUG, PRODUCT_FLOWS } from './_components/flow-config'
import { WizardContainer } from './_components/wizard-container'

type Props = {
  params: Promise<{ productTypeSlug: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function ContratarPage({ params, searchParams }: Props) {
  const { productTypeSlug } = await params
  const { step, proposalId, productId, simulationId } = await searchParams

  const dbSlug = URL_TO_DB_SLUG[productTypeSlug]
  if (!dbSlug) notFound()

  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) redirect('/indisponivel')

  const [product, proposal] = await Promise.all([
    productId ? getTenantProduct(productId, tenantId) : null,
    proposalId ? getProposal(proposalId, tenantId) : null,
  ])

  if (!product && !proposal) redirect('/simulador')

  const defaultStep = PRODUCT_FLOWS[dbSlug]?.etapa1[0]?.slug ?? 'operacao'

  return (
    <WizardContainer
      productTypeSlug={dbSlug}
      currentStep={step ?? defaultStep}
      proposal={proposal ?? null}
      product={product ?? null}
      productId={productId ?? null}
      simulationId={simulationId ?? null}
    />
  )
}

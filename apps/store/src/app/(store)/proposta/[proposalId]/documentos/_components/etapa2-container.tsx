'use client'

import { PRODUCT_FLOWS } from '@/app/(store)/contratar/[productTypeSlug]/_components/flow-config'
import { DotsIndicator } from '@/app/(store)/_components/dots-indicator'
import { DadosBancariosEtapa2Step } from '@/app/(store)/contratar/[productTypeSlug]/_components/etapa2/dados-bancarios-step'
import { DocumentosEmpresaStep } from '@/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-empresa-step'
import { DocumentosPessoaisPFStep } from '@/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-pessoais-pf-step'
import { DocumentosPessoaisSociosStep } from '@/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-pessoais-socios-step'
import { DocumentosImovelStep } from '@/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-imovel-step'
import { DocumentosVeiculoStep } from '@/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-veiculo-step'
import { DocumentosGarantiaStep } from '@/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-garantia-step'
import type { ProposalWithProduct } from '@/app/(store)/queries'
import type { WizardStepProps } from '@/app/(store)/contratar/[productTypeSlug]/_components/steps/types'
import type { DocumentItem } from '@/app/(store)/contratar/[productTypeSlug]/_components/shared/document-upload-checklist'

type Props = {
  proposal: ProposalWithProduct
  step: string
}

export function Etapa2Container({ proposal, step }: Props) {
  const slug = proposal.product_type_slug
  const flow = PRODUCT_FLOWS[slug]
  const stepProps: WizardStepProps = {
    proposalId: proposal.id,
    productId: null,
    productTypeSlug: slug,
    simulationId: null,
    proposal,
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {flow && flow.etapa2.length > 0 && (
        <DotsIndicator steps={flow.etapa2} currentStep={step} />
      )}
      <div className="mt-6">
        {renderStep(slug, step, stepProps)}
      </div>
    </div>
  )
}

function getNextEtapa2Step(slug: string, currentStep: string): string {
  const flow = PRODUCT_FLOWS[slug]?.etapa2 ?? []
  const idx = flow.findIndex((s) => s.slug === currentStep)
  return flow[idx + 1]?.slug ?? ''
}

function renderStep(slug: string, step: string, props: WizardStepProps) {
  if (step === 'dados-bancarios') {
    return <DadosBancariosEtapa2Step {...props} nextStep={getNextEtapa2Step(slug, step)} />
  }
  if (step === 'dados-bancarios-vendedor') {
    return <DadosBancariosEtapa2Step {...props} nextStep={getNextEtapa2Step(slug, step)} titularLabel="proprietário do imóvel" />
  }
  if (step === 'documentos-empresa') {
    const extraDocs: DocumentItem[] = slug === 'auto_equity_pj'
      ? [{ type: 'fotos_empresa', label: 'Fotos da empresa (fachada e interior)', accept: 'jpeg' as const }]
      : []
    return <DocumentosEmpresaStep {...props} nextStep={getNextEtapa2Step(slug, step)} extraDocs={extraDocs.length ? extraDocs : undefined} />
  }
  if (step === 'documentos-pessoais') {
    const withCnh = slug === 'auto_equity'
    return <DocumentosPessoaisPFStep {...props} nextStep={getNextEtapa2Step(slug, step)} withCnh={withCnh} />
  }
  if (step === 'documentos-pessoais-socios') {
    return <DocumentosPessoaisSociosStep {...props} nextStep={getNextEtapa2Step(slug, step)} />
  }
  if (step === 'documentos-imovel') {
    const nextStep = getNextEtapa2Step(slug, step)
    const isFinalStep = !nextStep || slug === 'home_equity' || slug === 'home_equity_pj'
    const extraDocs: DocumentItem[] = slug === 'financiamento_imovel'
      ? [{ type: 'aluguel', label: 'Contrato de Aluguel (se aplicável)' }]
      : []
    return <DocumentosImovelStep {...props} isFinalStep={isFinalStep} nextStep={nextStep} extraDocs={extraDocs.length ? extraDocs : undefined} />
  }
  if (step === 'documentos-veiculo') {
    return <DocumentosVeiculoStep {...props} />
  }
  if (step === 'documentos-garantia') {
    return <DocumentosGarantiaStep {...props} />
  }
  return <p className="text-sm text-muted-foreground">Step não reconhecido: {step}</p>
}

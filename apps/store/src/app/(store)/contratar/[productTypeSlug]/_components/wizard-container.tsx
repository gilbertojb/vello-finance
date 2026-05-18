'use client'

import { PRODUCT_FLOWS } from './flow-config'
import { StepIndicator } from './step-indicator'
import { HomeEquityWizard } from './wizards/home-equity-wizard'
import { HomeEquityPJWizard } from './wizards/home-equity-pj-wizard'
import { AutoEquityWizard } from './wizards/auto-equity-wizard'
import { AutoEquityPJWizard } from './wizards/auto-equity-pj-wizard'
import { FgtsWizard } from './wizards/fgts-wizard'
import { CapitalGiroWizard } from './wizards/capital-giro-wizard'
import { AntecipacaoRecebiveisWizard } from './wizards/antecipacao-recebiveis-wizard'
import { FinanciamentoImovelWizard } from './wizards/financiamento-imovel-wizard'
import { FinanciamentoVeiculoWizard } from './wizards/financiamento-veiculo-wizard'
import { ConsignadoPrivadoWizard } from './wizards/consignado-privado-wizard'
import type { ProposalWithProduct, TenantProduct } from '@/app/(store)/queries'
import type { ProductWizardProps } from './steps/types'

type Props = {
  productTypeSlug: string
  currentStep: string
  proposal: ProposalWithProduct | null
  product: TenantProduct | null
  productId: string | null
  simulationId: string | null
}

export function WizardContainer({ productTypeSlug, currentStep, proposal, productId, simulationId }: Props) {
  const flow = PRODUCT_FLOWS[productTypeSlug]
  if (!flow) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Produto não configurado: {productTypeSlug}</p>
      </div>
    )
  }

  const isRetorno = currentStep === 'retorno'
  const stepProps: ProductWizardProps = {
    proposalId: proposal?.id ?? null,
    productId,
    productTypeSlug,
    simulationId,
    proposal,
    currentStep,
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {!isRetorno && flow.etapa1.length > 1 && (
        <StepIndicator
          steps={flow.etapa1.filter((s) => s.slug !== 'retorno')}
          currentStep={currentStep}
        />
      )}
      <div className="mt-6">
        {renderWizard(productTypeSlug, stepProps)}
      </div>
    </div>
  )
}

function renderWizard(slug: string, props: ProductWizardProps) {
  switch (slug) {
    case 'home_equity':             return <HomeEquityWizard {...props} />
    case 'home_equity_pj':          return <HomeEquityPJWizard {...props} />
    case 'auto_equity':             return <AutoEquityWizard {...props} />
    case 'auto_equity_pj':          return <AutoEquityPJWizard {...props} />
    case 'fgts':                    return <FgtsWizard {...props} />
    case 'capital_giro':            return <CapitalGiroWizard {...props} />
    case 'antecipacao_recebiveis':  return <AntecipacaoRecebiveisWizard {...props} />
    case 'financiamento_imovel':    return <FinanciamentoImovelWizard {...props} />
    case 'financiamento_veiculo':   return <FinanciamentoVeiculoWizard {...props} />
    case 'consignado_privado':      return <ConsignadoPrivadoWizard {...props} />
    default:
      return <p className="text-sm text-muted-foreground">Wizard não implementado: {slug}</p>
  }
}

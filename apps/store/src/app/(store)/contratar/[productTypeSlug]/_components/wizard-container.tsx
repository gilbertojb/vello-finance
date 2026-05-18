'use client'

import { PRODUCT_FLOWS } from './flow-config'
import { StepIndicator } from './step-indicator'
import type { ProposalWithProduct, TenantProduct } from '@/app/(store)/queries'

function UnimplementedStep({ stepSlug }: { stepSlug: string }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      Step <code>{stepSlug}</code> — a ser implementado
    </div>
  )
}

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
  if (!flow) return <p className="p-8 text-center text-sm text-muted-foreground">Produto não configurado.</p>

  const isRetorno = currentStep === 'retorno'

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {!isRetorno && (
        <StepIndicator
          steps={flow.etapa1.filter((s) => s.slug !== 'retorno')}
          currentStep={currentStep}
        />
      )}
      <div className="mt-2">
        <UnimplementedStep stepSlug={currentStep} />
      </div>
    </div>
  )
}

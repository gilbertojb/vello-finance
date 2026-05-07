import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Image from 'next/image'
import { getTenantBranding } from '@/lib/branding'
import { getTenantProduct } from '../../queries'
import { createProposal } from './actions'
import { StepIndicator } from './_components/step-indicator'
import { StepOneForm } from './_components/step-one-form'
import { StepTwoForm } from './_components/step-two-form'

export const metadata: Metadata = { title: 'Solicitar crédito' }

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    step?: string
    purpose?: string
    amount?: string
    term?: string
    name?: string
    email?: string
  }>
}

export default async function RequestPage({ params, searchParams }: Props) {
  const { id } = await params
  const sp = await searchParams

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id') ?? ''

  const [tp, branding] = await Promise.all([
    getTenantProduct(id, tenantId),
    getTenantBranding(tenantId),
  ])

  if (!tp || !tp.products) notFound()

  const step = sp.step === '2' ? 2 : 1
  const minRate = tp.products.min_rate_monthly ?? 0
  const initialAmount = Number(sp.amount) || tp.products.min_amount || 1000
  const initialTerm = Number(sp.term) || tp.products.min_term_months || 12

  const boundAction = createProposal.bind(null, id, tp.products.id)

  const step1Data = {
    purpose: sp.purpose ?? '',
    amount: sp.amount ?? String(initialAmount),
    term: sp.term ?? String(initialTerm),
    name: sp.name ?? '',
    email: sp.email ?? '',
  }

  return (
    <div className="flex min-h-svh">
      {/* Painel esquerdo — branding */}
      <aside className="relative hidden w-[35%] flex-col justify-between overflow-hidden bg-gradient-to-br from-primary/80 to-primary p-10 lg:flex">
        {branding?.auth_bg_image_url && (
          <Image
            src={branding.auth_bg_image_url}
            alt=""
            fill
            className="object-cover opacity-20"
          />
        )}
        <div className="relative z-10">
          {branding?.logo_url ? (
            <Image
              src={branding.logo_url}
              alt={branding.company_display_name ?? ''}
              width={120}
              height={40}
              className="h-10 w-auto object-contain brightness-0 invert"
            />
          ) : (
            <span className="text-xl font-bold text-primary-foreground">
              {branding?.company_display_name ?? 'Vello'}
            </span>
          )}
        </div>
        <div className="relative z-10 space-y-4">
          <h2 className="text-2xl font-bold text-primary-foreground">
            {tp.products.name}
          </h2>
          <p className="text-sm leading-relaxed text-primary-foreground/80">
            Preencha seus dados para receber a análise da sua proposta.
          </p>
        </div>
      </aside>

      {/* Painel direito — formulário */}
      <div className="flex flex-1 items-start justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md space-y-8">
          <div>
            <StepIndicator currentStep={step as 1 | 2} />
            <h1 className="mt-4 text-xl font-bold text-foreground">
              {step === 1 ? 'Dados da simulação' : 'Dados pessoais'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1
                ? 'Informe os detalhes do crédito que você precisa.'
                : 'Precisamos de algumas informações para continuar.'}
            </p>
          </div>

          {step === 1 ? (
            <StepOneForm
              tenantProductId={id}
              minRate={minRate}
              initialAmount={initialAmount}
              initialTerm={initialTerm}
            />
          ) : (
            <StepTwoForm
              tenantProductId={id}
              action={boundAction}
              step1Data={step1Data}
            />
          )}
        </div>
      </div>
    </div>
  )
}

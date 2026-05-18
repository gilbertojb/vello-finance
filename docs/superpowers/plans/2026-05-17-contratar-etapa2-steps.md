# Contratação — Etapa 2 Steps + Documentos Page

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **Prerequisite:** `2026-05-17-contratar-shared-steps.md` deve estar concluído (types.ts e componentes shared/).

**Goal:** Steps da Etapa 2 (dados bancários + checklist de documentos) + `Etapa2Container` que despacha por produto + atualização da página `/proposta/[id]/documentos`.

**Architecture:** Rota `/proposta/[proposalId]/documentos?step=dados-bancarios`. `Etapa2Container` (Client Component) faz switch por `productTypeSlug + step`. Cada step de documentos usa `DocumentUploadChecklist`. Steps bancários usam `BankDataForm`.

**Spec refs:** cada spec em `docs/features/store/contratar/`.

---

### Task 1: `dados-bancarios-step.tsx` (Etapa 2)

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/etapa2/dados-bancarios-step.tsx`

Usado em todos os produtos com Etapa 2, exceto `financiamento_imovel` que tem `dados-bancarios-vendedor`.

- [ ] **Step 1: Criar o componente**

```tsx
'use client'
import { useState, useTransition } from 'react'
import { saveStep } from '../../../actions'
import { btnCls } from '../steps/types'
import { BankDataForm, type BankData } from '../shared/bank-data-form'
import type { WizardStepProps } from '../steps/types'

const EMPTY: BankData = { banco: '', agencia: '', conta: '', pix: '', confirmaTitularidade: false }

type Props = WizardStepProps & { nextStep: string; titularLabel?: string }

export function DadosBancariosEtapa2Step({ proposalId, proposal, nextStep, titularLabel }: Props) {
  const saved = ((proposal?.form_data as Record<string, unknown>)?.['dados-bancarios'] ?? {}) as Partial<BankData>
  const [bankData, setBankData] = useState<BankData>({ ...EMPTY, ...saved })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!bankData.banco || !bankData.agencia || !bankData.conta) return setError('Preencha banco, agência e conta.')
    if (!bankData.confirmaTitularidade) return setError('A conta informada não corresponde ao titular do crédito. Utilize uma conta bancária em seu nome.')
    setError('')
    startTransition(async () => {
      const res = await saveStep({ proposalId: proposalId!, stepSlug: 'dados-bancarios', stepData: bankData, nextStep })
      if (res && 'error' in res) setError(res.error)
    })
  }

  return (
    <div className="space-y-5">
      <BankDataForm value={bankData} onChange={setBankData} titularLabel={titularLabel} error={error} />
      <button onClick={handleSubmit} disabled={isPending} className={btnCls}>
        {isPending ? 'Salvando…' : 'Prosseguir'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): DadosBancariosEtapa2Step"
```

---

### Task 2: Steps de documentos compartilhados

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-empresa-step.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-pessoais-pf-step.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-pessoais-socios-step.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-imovel-step.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-veiculo-step.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/etapa2/documentos-garantia-step.tsx`

- [ ] **Step 1: Criar `documentos-empresa-step.tsx`**

Checklist padrão PJ. Usado em `home_equity_pj`, `auto_equity_pj`, `capital_giro`, `antecipacao_recebiveis`, `financiamento_imovel`, `financiamento_veiculo` (não).

```tsx
'use client'
import { useTransition } from 'react'
import { saveStep } from '../../../actions'
import { DocumentUploadChecklist, type DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS_EMPRESA: DocumentItem[] = [
  { type: 'cnpj', label: 'CNPJ' },
  { type: 'contrato_social', label: 'Contrato Social atualizado' },
  { type: 'endereco_empresa', label: 'Comprovante de endereço da empresa', hint: 'Últimos 3 meses' },
  { type: 'balanco_patrimonial', label: 'Balanço Patrimonial do último ano' },
  { type: 'balancete', label: 'Balancete dos últimos 3 meses' },
  { type: 'dre', label: 'DRE do último ano ou Simples Nacional' },
  { type: 'faturamentos', label: 'Relação dos últimos 12 faturamentos', hint: 'Com assinatura do contador' },
  { type: 'extrato_pj', label: 'Extrato bancário PJ', hint: 'Últimos 3 meses' },
  { type: 'extrato_pf', label: 'Extrato PF', hint: 'Últimos 3 meses' },
  { type: 'rg_cpf_socios', label: 'RG e CPF dos sócios (frente e verso)' },
]

type Props = WizardStepProps & { nextStep: string; extraDocs?: DocumentItem[] }

export function DocumentosEmpresaStep({ proposalId, nextStep, extraDocs }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleAllUploaded() {
    startTransition(async () => {
      await saveStep({ proposalId: proposalId!, stepSlug: 'documentos-empresa', stepData: { uploaded: true }, nextStep })
    })
  }

  return (
    <DocumentUploadChecklist
      proposalId={proposalId!}
      documents={extraDocs ? [...DOCS_EMPRESA, ...extraDocs] : DOCS_EMPRESA}
      onAllUploaded={handleAllUploaded}
    />
  )
}
```

- [ ] **Step 2: Criar `documentos-pessoais-pf-step.tsx`**

Para `home_equity` PF. `withConjuge` ativa documentos do cônjuge.

```tsx
'use client'
import { useTransition } from 'react'
import { saveStep } from '../../../actions'
import { DocumentUploadChecklist, type DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS_PF: DocumentItem[] = [
  { type: 'rg_cpf', label: 'RG e CPF (frente e verso)' },
  { type: 'estado_civil', label: 'Comprovante de estado civil' },
  { type: 'endereco', label: 'Comprovante de endereço', hint: 'Últimos 3 meses' },
  { type: 'ir', label: 'Declaração do IR com recibo de entrega' },
]
const DOCS_CONJUGE: DocumentItem[] = [
  { type: 'conjuge_rg_cpf', label: 'RG e CPF do cônjuge (frente e verso)' },
  { type: 'conjuge_estado_civil', label: 'Comprovante de estado civil do cônjuge' },
  { type: 'conjuge_endereco', label: 'Comprovante de endereço do cônjuge', hint: 'Últimos 3 meses' },
  { type: 'conjuge_ir', label: 'Declaração do IR do cônjuge com recibo' },
]

type Props = WizardStepProps & { nextStep: string; withCnh?: boolean }

export function DocumentosPessoaisPFStep({ proposalId, proposal, nextStep, withCnh }: Props) {
  const hasConjuge = (proposal?.form_data as Record<string, unknown>)?.['dados-pessoais']?.['estadoCivil'] === 'casado'
  const [isPending, startTransition] = useTransition()

  const docs: DocumentItem[] = [
    ...DOCS_PF,
    ...(withCnh ? [{ type: 'cnh', label: 'CNH (frente e verso)' }] : []),
    ...(hasConjuge ? DOCS_CONJUGE : []),
  ]

  function handleAllUploaded() {
    startTransition(async () => {
      await saveStep({ proposalId: proposalId!, stepSlug: 'documentos-pessoais', stepData: { uploaded: true }, nextStep })
    })
  }

  return <DocumentUploadChecklist proposalId={proposalId!} documents={docs} onAllUploaded={handleAllUploaded} />
}
```

- [ ] **Step 3: Criar `documentos-pessoais-socios-step.tsx`**

Para produtos PJ. Checklist fixo (não varia por sócio individual — upload agrupado por tipo).

```tsx
'use client'
import { useTransition } from 'react'
import { saveStep } from '../../../actions'
import { DocumentUploadChecklist, type DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS: DocumentItem[] = [
  { type: 'socios_rg_cpf', label: 'RG e CPF dos sócios (frente e verso)' },
  { type: 'socios_estado_civil', label: 'Comprovante de estado civil dos sócios' },
  { type: 'socios_endereco', label: 'Comprovante de endereço dos sócios', hint: 'Últimos 3 meses' },
  { type: 'socios_ir', label: 'Declaração do IR dos sócios com recibo de entrega' },
]

type Props = WizardStepProps & { nextStep: string }

export function DocumentosPessoaisSociosStep({ proposalId, nextStep }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleAllUploaded() {
    startTransition(async () => {
      await saveStep({ proposalId: proposalId!, stepSlug: 'documentos-pessoais-socios', stepData: { uploaded: true }, nextStep })
    })
  }

  return <DocumentUploadChecklist proposalId={proposalId!} documents={DOCS} onAllUploaded={handleAllUploaded} />
}
```

- [ ] **Step 4: Criar `documentos-imovel-step.tsx`**

```tsx
'use client'
import { useTransition } from 'react'
import { saveStep, finalizeEtapa2 } from '../../../actions'
import { DocumentUploadChecklist, type DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS: DocumentItem[] = [
  { type: 'matricula', label: 'Matrícula atualizada' },
  { type: 'iptu', label: 'IPTU com metragens' },
  { type: 'cnd', label: 'CND de Tributos Imobiliários', hint: 'Válido até 30 dias' },
  { type: 'endereco_imovel', label: 'Comprovante de endereço do imóvel' },
  { type: 'fotos_imovel', label: 'Fotos do imóvel (externas e internas)', accept: 'jpeg' as const },
]

type Props = WizardStepProps & { isFinalStep?: boolean; nextStep?: string; extraDocs?: DocumentItem[] }

export function DocumentosImovelStep({ proposalId, isFinalStep, nextStep, extraDocs }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleAllUploaded() {
    startTransition(async () => {
      if (isFinalStep) {
        await finalizeEtapa2(proposalId!)
      } else {
        await saveStep({ proposalId: proposalId!, stepSlug: 'documentos-imovel', stepData: { uploaded: true }, nextStep: nextStep! })
      }
    })
  }

  const docs = extraDocs ? [...DOCS, ...extraDocs] : DOCS
  return <DocumentUploadChecklist proposalId={proposalId!} documents={docs} onAllUploaded={handleAllUploaded} />
}
```

- [ ] **Step 5: Criar `documentos-veiculo-step.tsx`**

```tsx
'use client'
import { useTransition } from 'react'
import { finalizeEtapa2 } from '../../../actions'
import { DocumentUploadChecklist, type DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS: DocumentItem[] = [
  { type: 'crlv', label: 'CRLV do veículo' },
  { type: 'foto_traseira', label: 'Foto traseira do veículo', accept: 'jpeg' as const },
  { type: 'foto_placa', label: 'Foto da placa traseira', accept: 'jpeg' as const },
  { type: 'foto_chassi', label: 'Foto do chassi', accept: 'jpeg' as const },
]

export function DocumentosVeiculoStep({ proposalId }: WizardStepProps) {
  const [isPending, startTransition] = useTransition()

  function handleAllUploaded() {
    startTransition(async () => { await finalizeEtapa2(proposalId!) })
  }

  return <DocumentUploadChecklist proposalId={proposalId!} documents={DOCS} onAllUploaded={handleAllUploaded} />
}
```

- [ ] **Step 6: Criar `documentos-garantia-step.tsx`**

Para `capital_giro` (garantia real) e `antecipacao_recebiveis` (recebíveis). O tipo de garantia/recebível vem de `proposal.form_data`.

```tsx
'use client'
import { useTransition } from 'react'
import { finalizeEtapa2 } from '../../../actions'
import { DocumentUploadChecklist, type DocumentItem } from '../shared/document-upload-checklist'
import type { WizardStepProps } from '../steps/types'

const DOCS_IMOVEL: DocumentItem[] = [
  { type: 'garantia_matricula', label: 'Matrícula atualizada' },
  { type: 'garantia_iptu', label: 'IPTU com metragens' },
  { type: 'garantia_cnd', label: 'CND de Tributos Imobiliários', hint: 'Válido até 30 dias' },
  { type: 'garantia_endereco', label: 'Comprovante de endereço do imóvel' },
  { type: 'garantia_fotos', label: 'Fotos do imóvel', accept: 'jpeg' as const },
]
const DOCS_RECEBIVEIS: DocumentItem[] = [
  { type: 'recebiveis_extrato', label: 'Extrato de vendas / recebíveis', hint: 'Últimos 3 meses' },
  { type: 'recebiveis_contratos', label: 'Contratos / notas fiscais' },
]
const DOCS_DEFAULT: DocumentItem[] = [
  { type: 'garantia_comprovante', label: 'Documento comprobatório da garantia' },
]

export function DocumentosGarantiaStep({ proposalId, proposal }: WizardStepProps) {
  const tipoGarantia = (proposal?.form_data as Record<string, unknown>)?.['garantia']?.['tipoGarantia'] as string | undefined
  const tipoRecebivel = (proposal?.form_data as Record<string, unknown>)?.['operacao']?.['tipoRecebivel'] as string | undefined
  const [isPending, startTransition] = useTransition()

  const docs = tipoGarantia === 'Imóvel Empresarial' ? DOCS_IMOVEL
    : tipoRecebivel ? DOCS_RECEBIVEIS
    : DOCS_DEFAULT

  function handleAllUploaded() {
    startTransition(async () => { await finalizeEtapa2(proposalId!) })
  }

  return <DocumentUploadChecklist proposalId={proposalId!} documents={docs} onAllUploaded={handleAllUploaded} />
}
```

- [ ] **Step 7: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "_components/etapa2"
```

Expected: sem output.

- [ ] **Step 8: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): steps de documentos da Etapa 2"
```

---

### Task 3: `Etapa2Container` + página de documentos

**Files:**
- Create: `apps/store/src/app/(store)/proposta/[proposalId]/documentos/_components/etapa2-container.tsx`
- Modify: `apps/store/src/app/(store)/proposta/[proposalId]/documentos/page.tsx`

- [ ] **Step 1: Criar `etapa2-container.tsx`**

Despacha steps da Etapa 2 por `productTypeSlug + step`. Também renderiza o `StepIndicator` da Etapa 2.

```tsx
'use client'
import { PRODUCT_FLOWS } from '../../../contratar/[productTypeSlug]/_components/flow-config'
import { StepIndicator } from '../../../contratar/[productTypeSlug]/_components/step-indicator'
import { DadosBancariosEtapa2Step } from '../../../contratar/[productTypeSlug]/_components/etapa2/dados-bancarios-step'
import { DocumentosEmpresaStep } from '../../../contratar/[productTypeSlug]/_components/etapa2/documentos-empresa-step'
import { DocumentosPessoaisPFStep } from '../../../contratar/[productTypeSlug]/_components/etapa2/documentos-pessoais-pf-step'
import { DocumentosPessoaisSociosStep } from '../../../contratar/[productTypeSlug]/_components/etapa2/documentos-pessoais-socios-step'
import { DocumentosImovelStep } from '../../../contratar/[productTypeSlug]/_components/etapa2/documentos-imovel-step'
import { DocumentosVeiculoStep } from '../../../contratar/[productTypeSlug]/_components/etapa2/documentos-veiculo-step'
import { DocumentosGarantiaStep } from '../../../contratar/[productTypeSlug]/_components/etapa2/documentos-garantia-step'
import type { ProposalWithProduct } from '../../../../queries'

type Props = {
  proposal: ProposalWithProduct
  step: string
}

export function Etapa2Container({ proposal, step }: Props) {
  const slug = proposal.product_type_slug
  const flow = PRODUCT_FLOWS[slug]
  const stepProps = { proposalId: proposal.id, productId: null, productTypeSlug: slug, simulationId: null, proposal }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {flow && flow.etapa2.length > 0 && (
        <StepIndicator steps={flow.etapa2} currentStep={step} />
      )}
      <div className="mt-6">
        {renderStep(slug, step, stepProps)}
      </div>
    </div>
  )
}

function renderStep(slug: string, step: string, props: Parameters<typeof DadosBancariosEtapa2Step>[0] & { proposal: ProposalWithProduct }) {
  // Dados bancários — maioria dos produtos
  if (step === 'dados-bancarios') {
    const nextStep = getNextEtapa2Step(slug, step)
    return <DadosBancariosEtapa2Step {...props} nextStep={nextStep} />
  }
  if (step === 'dados-bancarios-vendedor') {
    const nextStep = getNextEtapa2Step(slug, step)
    return <DadosBancariosEtapa2Step {...props} nextStep={nextStep} titularLabel="proprietário do imóvel" />
  }
  if (step === 'documentos-empresa') {
    const nextStep = getNextEtapa2Step(slug, step)
    const extraDocs = slug === 'auto_equity_pj' ? [{ type: 'fotos_empresa', label: 'Fotos da empresa (fachada e interior)', accept: 'jpeg' as const }] : []
    return <DocumentosEmpresaStep {...props} nextStep={nextStep} extraDocs={extraDocs.length ? extraDocs : undefined} />
  }
  if (step === 'documentos-pessoais') {
    const nextStep = getNextEtapa2Step(slug, step)
    const withCnh = slug === 'auto_equity'
    return <DocumentosPessoaisPFStep {...props} nextStep={nextStep} withCnh={withCnh} />
  }
  if (step === 'documentos-pessoais-socios') {
    const nextStep = getNextEtapa2Step(slug, step)
    return <DocumentosPessoaisSociosStep {...props} nextStep={nextStep} />
  }
  if (step === 'documentos-imovel') {
    const nextStep = getNextEtapa2Step(slug, step)
    const isFinalStep = !nextStep || slug === 'home_equity' || slug === 'home_equity_pj'
    const extraDocs = slug === 'financiamento_imovel' ? [{ type: 'aluguel', label: 'Contrato de Aluguel (se aplicável)' }] : []
    return <DocumentosImovelStep {...props} isFinalStep={isFinalStep} nextStep={nextStep} extraDocs={extraDocs.length ? extraDocs : undefined} />
  }
  if (step === 'documentos-veiculo') {
    return <DocumentosVeiculoStep {...props} />
  }
  if (step === 'documentos-garantia') {
    return <DocumentosGarantiaStep {...props} />
  }
  return <p className="text-sm text-surface-foreground/40">Step não reconhecido: {step}</p>
}

function getNextEtapa2Step(slug: string, currentStep: string): string {
  const flow = PRODUCT_FLOWS[slug]?.etapa2 ?? []
  const idx = flow.findIndex(s => s.slug === currentStep)
  return flow[idx + 1]?.slug ?? ''
}
```

- [ ] **Step 2: Atualizar `page.tsx` dos documentos**

Substituir o stub pelo Etapa2Container real:

```tsx
// apps/store/src/app/(store)/proposta/[proposalId]/documentos/page.tsx
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getProposal } from '../../../queries'
import { Etapa2Container } from './_components/etapa2-container'

type Props = {
  params: Promise<{ proposalId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function DocumentosPage({ params, searchParams }: Props) {
  const { proposalId } = await params
  const { step } = await searchParams
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) notFound()

  const proposal = await getProposal(proposalId, tenantId)
  if (!proposal) notFound()

  const currentStep = step ?? 'dados-bancarios'

  return <Etapa2Container proposal={proposal} step={currentStep} />
}
```

- [ ] **Step 3: Verificar build**

```bash
pnpm --filter @vello/store build 2>&1 | tail -15
```

Expected: build passa.

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/(store)/proposta/
git commit -m "feat(store): Etapa2Container e página de documentos"
```

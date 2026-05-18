# Design Consistency — Vello Store Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar o design do Vello Store — simulador, wizard e cards de resultado — com tokens consistentes (DotsIndicator, h-11 inputs, rounded-[10px], white cards) e PDF formal com tabela de parcelas PRICE/SAC.

**Architecture:** Três camadas: (1) fundação — novos utilitários compartilhados; (2) estrutural — WizardContainer ganha header+card, simulator ganha DotsIndicator; (3) visual — cards de resultado migram dark→light, PDF reescrito. Nenhum componente shadcn global é alterado — tokens aplicados via wrappers StoreInput/StoreButton.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS, shadcn/ui, @react-pdf/renderer 4.x, TypeScript

---

## Mapa de arquivos

**Criar:**
- `apps/store/src/lib/calc-installments.ts`
- `apps/store/src/app/(store)/_components/dots-indicator.tsx`
- `apps/store/src/components/ui/store-input.tsx`
- `apps/store/src/components/ui/store-button.tsx`

**Modificar:**
- `wizard-container.tsx` — header badge/título + card branco + DotsIndicator
- `step-indicator.tsx` — **deletar** (substituído por DotsIndicator)
- 20 arquivos do wizard (wizards/ + steps/ + shared/) — trocar imports Input→StoreInput, Button→StoreButton
- 5 títulos inline em wizard files — remover (WizardContainer agora provê o título)
- 18 simulator pages (9 form + 9 resultado) — trocar SimulatorStepIndicator por DotsIndicator
- 9+ simulator form components — normalizar classes de inputs/botões
- 10 result card components — dark card → light card
- `simulation-pdf.tsx` — redesenho completo
- `pdf/route.ts` — calcular parcelas e passar para o PDF

---

### Task 1: `calc-installments.ts` — schedule PRICE e SAC

**Files:**
- Create: `apps/store/src/lib/calc-installments.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
// apps/store/src/lib/calc-installments.ts

export type PriceInstallment = {
  n: number
  juros: number
  amortizacao: number
  saldoDevedor: number
}

export type SacInstallment = {
  n: number
  amortizacao: number
  juros: number
  valorParcela: number
  saldoDevedor: number
}

export function calcPriceSchedule(
  principal: number,
  monthlyRatePct: number,
  months: number,
): PriceInstallment[] {
  const r = monthlyRatePct / 100
  if (r === 0) {
    const amort = principal / months
    return Array.from({ length: months }, (_, i) => ({
      n: i + 1,
      juros: 0,
      amortizacao: amort,
      saldoDevedor: Math.max(0, principal - amort * (i + 1)),
    }))
  }
  const pmt = (principal * (r * Math.pow(1 + r, months))) / (Math.pow(1 + r, months) - 1)
  const result: PriceInstallment[] = []
  let saldo = principal
  for (let i = 0; i < months; i++) {
    const juros = saldo * r
    const amortizacao = pmt - juros
    saldo = Math.max(0, saldo - amortizacao)
    result.push({ n: i + 1, juros, amortizacao, saldoDevedor: saldo })
  }
  return result
}

export function calcSacSchedule(
  principal: number,
  monthlyRatePct: number,
  months: number,
): SacInstallment[] {
  const r = monthlyRatePct / 100
  const amortizacao = principal / months
  const result: SacInstallment[] = []
  let saldo = principal
  for (let i = 0; i < months; i++) {
    const juros = saldo * r
    const valorParcela = amortizacao + juros
    saldo = Math.max(0, saldo - amortizacao)
    result.push({ n: i + 1, amortizacao, juros, valorParcela, saldoDevedor: saldo })
  }
  return result
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```
Esperado: sem erros no novo arquivo.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/lib/calc-installments.ts
git commit -m "feat(store): criar calc-installments — schedule PRICE e SAC para PDF"
```

---

### Task 2: `DotsIndicator` + export de SIMULATOR_STEPS

**Files:**
- Create: `apps/store/src/app/(store)/_components/dots-indicator.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// apps/store/src/app/(store)/_components/dots-indicator.tsx

type Step = { slug: string; label: string }

type Props = {
  steps: Step[]
  currentStep: string
}

export const SIMULATOR_STEPS: Step[] = [
  { slug: 'produto', label: 'Produto' },
  { slug: 'dados', label: 'Dados' },
  { slug: 'resultado', label: 'Resultado' },
]

export function DotsIndicator({ steps, currentStep }: Props) {
  const currentIndex = steps.findIndex((s) => s.slug === currentStep)

  return (
    <div className="mb-6 w-full">
      <div className="flex items-center gap-1.5">
        {steps.map((s, i) => (
          <div
            key={s.slug}
            className={
              i < currentIndex
                ? 'h-2 w-2 rounded-full bg-primary'
                : i === currentIndex
                  ? 'h-2 w-5 rounded-full bg-primary'
                  : 'h-2 w-2 rounded-full bg-surface-foreground/12'
            }
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-surface-foreground/50">
          {currentIndex >= 0 && (
            <>
              Passo{' '}
              <span className="text-surface-foreground/80">{currentIndex + 1}</span> de{' '}
              <span className="text-surface-foreground/80">{steps.length}</span>
            </>
          )}
        </p>
        {currentIndex >= 0 && (
          <p className="text-xs font-semibold text-surface-foreground/70">
            {steps[currentIndex]?.label}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add "apps/store/src/app/(store)/_components/dots-indicator.tsx"
git commit -m "feat(store): criar DotsIndicator — substitui SimulatorStepIndicator e StepIndicator"
```

---

### Task 3: `StoreInput` e `StoreButton` — wrappers de tokens

**Files:**
- Create: `apps/store/src/components/ui/store-input.tsx`
- Create: `apps/store/src/components/ui/store-button.tsx`

- [ ] **Step 1: Criar StoreInput**

```tsx
// apps/store/src/components/ui/store-input.tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Input } from './input'

export function StoreInput({ className, ...props }: ComponentProps<typeof Input>) {
  return <Input className={cn('h-11 rounded-[10px]', className)} {...props} />
}
```

- [ ] **Step 2: Criar StoreButton**

```tsx
// apps/store/src/components/ui/store-button.tsx
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'
import { Button } from './button'

export function StoreButton({ className, ...props }: ComponentProps<typeof Button>) {
  return <Button className={cn('h-11 rounded-[10px]', className)} {...props} />
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/components/ui/store-input.tsx apps/store/src/components/ui/store-button.tsx
git commit -m "feat(store): StoreInput e StoreButton — tokens h-11 rounded-[10px]"
```

---

### Task 4: `WizardContainer` — header, card branco, DotsIndicator

**Files:**
- Modify: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizard-container.tsx`
- Delete: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/step-indicator.tsx`

- [ ] **Step 1: Reescrever wizard-container.tsx**

Substituir o arquivo inteiro por:

```tsx
'use client'

import { PRODUCT_FLOWS } from './flow-config'
import { DotsIndicator } from '@/app/(store)/_components/dots-indicator'
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

export function WizardContainer({
  productTypeSlug,
  currentStep,
  proposal,
  product,
  productId,
  simulationId,
}: Props) {
  const flow = PRODUCT_FLOWS[productTypeSlug]
  if (!flow) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Produto não configurado: {productTypeSlug}</p>
      </div>
    )
  }

  const isRetorno = currentStep === 'retorno'
  const visibleSteps = flow.etapa1.filter((s) => s.slug !== 'retorno')
  const productName = product?.products?.name ?? proposal?.products?.name ?? ''
  const currentStepLabel = flow.etapa1.find((s) => s.slug === currentStep)?.label ?? ''

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
      {!isRetorno && visibleSteps.length > 1 && (
        <DotsIndicator steps={visibleSteps} currentStep={currentStep} />
      )}
      {!isRetorno && (
        <div className="mb-5">
          {productName && (
            <span className="inline-flex items-center rounded-full bg-primary/15 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[.18em] text-surface-foreground">
              {productName}
            </span>
          )}
          <h2 className="mt-3 text-xl font-extrabold tracking-tight text-surface-foreground">
            {currentStepLabel}
          </h2>
        </div>
      )}
      <div className={!isRetorno ? 'rounded-2xl border border-surface-foreground/10 bg-white p-6 max-sm:p-5' : ''}>
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
```

- [ ] **Step 2: Deletar step-indicator.tsx**

```bash
rm "apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/step-indicator.tsx"
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```
Esperado: sem erros (`step-indicator.tsx` era importado apenas em `wizard-container.tsx`).

- [ ] **Step 4: Commit**

```bash
git add "apps/store/src/app/(store)/contratar/"
git commit -m "feat(store): wizard — header badge/título, card branco, DotsIndicator"
```

---

### Task 5: Wizard steps — StoreInput, StoreButton, remover títulos inline

**Files (20 arquivos):**
- `_components/wizards/fgts-wizard.tsx`
- `_components/wizards/consignado-privado-wizard.tsx`
- `_components/wizards/capital-giro-wizard.tsx`
- `_components/wizards/home-equity-wizard.tsx`
- `_components/wizards/home-equity-pj-wizard.tsx`
- `_components/wizards/auto-equity-wizard.tsx`
- `_components/wizards/auto-equity-pj-wizard.tsx`
- `_components/wizards/antecipacao-recebiveis-wizard.tsx`
- `_components/wizards/financiamento-imovel-wizard.tsx`
- `_components/wizards/financiamento-veiculo-wizard.tsx`
- `_components/steps/dados-pessoais-pf-step.tsx`
- `_components/steps/dados-empresa-pj-step.tsx`
- `_components/steps/atividade-faturamento-step.tsx`
- `_components/steps/dados-vendedor-step.tsx`
- `_components/steps/renda-ocupacao-step.tsx`
- `_components/shared/address-form.tsx`
- `_components/shared/bank-data-form.tsx`
- `_components/shared/socio-fields.tsx`
- `_components/etapa2/dados-bancarios-step.tsx`
- `_components/steps/dados-socios-step.tsx` (se importar Input)

Todos os caminhos são relativos a `apps/store/src/app/(store)/contratar/[productTypeSlug]/`.

- [ ] **Step 1: Substituir imports via sed**

```bash
WIZARD_DIR="apps/store/src/app/(store)/contratar/\[productTypeSlug\]"

# Input → StoreInput
find "$WIZARD_DIR" -name "*.tsx" | xargs sed -i '' \
  "s|import { Input } from '@/components/ui/input'|import { StoreInput as Input } from '@/components/ui/store-input'|g"

# Button → StoreButton
find "$WIZARD_DIR" -name "*.tsx" | xargs sed -i '' \
  "s|import { Button } from '@/components/ui/button'|import { StoreButton as Button } from '@/components/ui/store-button'|g"

# SelectTrigger: adicionar tokens de altura e raio
find "$WIZARD_DIR" -name "*.tsx" | xargs sed -i '' \
  's/<SelectTrigger className="w-full">/<SelectTrigger className="w-full h-11 rounded-[10px]">/g'
```

- [ ] **Step 2: Remover títulos inline de fgts-wizard.tsx**

Em `_components/wizards/fgts-wizard.tsx`, remover as duas linhas:
```diff
-       <p className="text-base font-semibold">Saque Aniversário do FGTS</p>
```
```diff
-       <p className="text-base font-semibold">Autorização dos bancos no FGTS</p>
```

- [ ] **Step 3: Remover títulos inline de consignado-privado-wizard.tsx**

Em `_components/wizards/consignado-privado-wizard.tsx`, remover:
```diff
-       <p className="text-base font-semibold">Verificação de elegibilidade</p>
```
```diff
-       <p className="text-base font-semibold">Autorização Dataprev</p>
```

- [ ] **Step 4: Remover título inline de capital-giro-wizard.tsx**

Em `_components/wizards/capital-giro-wizard.tsx`, remover:
```diff
-       <p className="text-base font-semibold">Garantia na Operação</p>
```

- [ ] **Step 5: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add "apps/store/src/app/(store)/contratar/"
git commit -m "feat(store): wizard steps — StoreInput/StoreButton, remover títulos duplicados"
```

---

### Task 6: Simulator pages — substituir SimulatorStepIndicator por DotsIndicator

**Files (18 arquivos):**

Form pages (usar `currentStep="dados"`):
- `simulador/pessoa-fisica/fgts/page.tsx`
- `simulador/pessoa-fisica/consignado/page.tsx`
- `simulador/pessoa-fisica/imovel-em-garantia/page.tsx`
- `simulador/pessoa-fisica/veiculo-em-garantia/page.tsx`
- `simulador/pessoa-fisica/emprestimo-pessoal/page.tsx`
- `simulador/pessoa-fisica/conta-de-luz/page.tsx`
- `simulador/financiamentos/imovel/page.tsx`
- `simulador/financiamentos/veiculo/page.tsx`
- `simulador/pessoa-juridica/capital-de-giro/page.tsx`
- `simulador/pessoa-juridica/antecipacao-recebiveis/page.tsx`

Resultado pages (usar `currentStep="resultado"`):
- `simulador/pessoa-fisica/fgts/resultado/page.tsx`
- `simulador/pessoa-fisica/consignado/resultado/page.tsx`
- `simulador/pessoa-fisica/imovel-em-garantia/resultado/page.tsx`
- `simulador/pessoa-fisica/veiculo-em-garantia/resultado/page.tsx`
- `simulador/pessoa-fisica/emprestimo-pessoal/resultado/page.tsx`
- `simulador/pessoa-fisica/conta-de-luz/resultado/page.tsx`
- `simulador/financiamentos/imovel/resultado/page.tsx`
- `simulador/financiamentos/veiculo/resultado/page.tsx`

Todos os caminhos relativos a `apps/store/src/app/(store)/`.

- [ ] **Step 1: Substituir import via sed**

```bash
SIM_DIR="apps/store/src/app/(store)/simulador"

find "$SIM_DIR" -name "page.tsx" | xargs sed -i '' \
  "s|import { SimulatorStepIndicator } from '@/app/(store)/_components/simulator-step-indicator'|import { DotsIndicator, SIMULATOR_STEPS } from '@/app/(store)/_components/dots-indicator'|g"
```

- [ ] **Step 2: Substituir JSX nas form pages (currentStep="dados")**

Padrão antes (em cada form page):
```tsx
        <div className="mb-10">
          <SimulatorStepIndicator currentStep={2} />
        </div>
```

Padrão depois:
```tsx
        <DotsIndicator steps={SIMULATOR_STEPS} currentStep="dados" />
```

Aplicar manualmente nos 10 form pages listados acima. Também alterar o padding do card branco na mesma página:
```diff
-         <div className="rounded-2xl border border-surface-foreground/10 bg-white p-10 max-sm:p-6">
+         <div className="rounded-2xl border border-surface-foreground/10 bg-white p-6 max-sm:p-5">
```

- [ ] **Step 3: Substituir JSX nas resultado pages (currentStep="resultado")**

Padrão antes (em cada resultado page):
```tsx
        <div className="mb-10">
          <SimulatorStepIndicator currentStep={3} />
        </div>
```

Padrão depois:
```tsx
        <DotsIndicator steps={SIMULATOR_STEPS} currentStep="resultado" />
```

Aplicar manualmente nas 8 resultado pages. Também normalizar padding do card branco de `p-10 max-sm:p-6` para `p-6 max-sm:p-5`.

- [ ] **Step 4: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add "apps/store/src/app/(store)/simulador/"
git commit -m "feat(store): simulador — DotsIndicator, padding p-6, remover SimulatorStepIndicator"
```

---

### Task 7: Simulator form inputs — normalizar altura e raio

**Files:** todos os `_components/*-form.tsx` dentro dos subdiretórios do simulador.

O padrão atual usa inputs HTML raw com `rounded-2xl py-4 px-5`. O padrão novo é `h-11 rounded-[10px] px-4`.

- [ ] **Step 1: Substituir classes de input via sed**

```bash
SIM_DIR="apps/store/src/app/(store)/simulador"

# Substituir rounded-2xl border ... py-4 px-5 nos inputs (classes CSS dos raw inputs)
find "$SIM_DIR" -name "*-form.tsx" | xargs sed -i '' \
  's/rounded-2xl border border-surface-foreground\/15 bg-white px-5 py-4/h-11 rounded-\[10px\] border border-surface-foreground\/15 bg-white px-4/g'

# Substituir rounded-2xl nos selects de simulador
find "$SIM_DIR" -name "*-form.tsx" | xargs sed -i '' \
  's/appearance-none rounded-2xl border border-surface-foreground\/15 bg-white px-4 py-3/h-11 appearance-none rounded-\[10px\] border border-surface-foreground\/15 bg-white px-4/g'
```

- [ ] **Step 2: Normalizar botões de submit dos forms**

Padrão atual nos form components:
```
rounded-2xl bg-surface-foreground px-5 py-4 text-sm font-semibold text-surface
```

Padrão novo:
```
h-11 rounded-[10px] bg-primary px-5 text-sm font-semibold text-surface-foreground
```

```bash
find "$SIM_DIR" -name "*-form.tsx" | xargs sed -i '' \
  's/rounded-2xl bg-surface-foreground px-5 py-4 text-sm font-semibold text-surface/h-11 rounded-[10px] bg-primary px-5 text-sm font-semibold text-surface-foreground/g'
```

- [ ] **Step 3: Verificar TypeScript e inspecionar resultados do sed**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
# Confirmar que os arquivos foram alterados corretamente
grep -r "rounded-2xl.*py-4" apps/store/src/app/\(store\)/simulador/ --include="*-form.tsx"
```
Esperado: nenhum resultado (todas as instâncias foram substituídas).

- [ ] **Step 4: Commit**

```bash
git add "apps/store/src/app/(store)/simulador/"
git commit -m "feat(store): simulador forms — h-11 rounded-[10px], botão bg-primary"
```

---

### Task 8: Result cards — dark card → light card

**Files (10 arquivos):**
- `pessoa-fisica/fgts/resultado/_components/fgts-resultado.tsx`
- `pessoa-fisica/consignado/resultado/_components/consignado-resultado.tsx`
- `pessoa-fisica/imovel-em-garantia/resultado/_components/home-equity-resultado.tsx`
- `pessoa-fisica/veiculo-em-garantia/resultado/_components/auto-equity-resultado.tsx`
- `pessoa-fisica/emprestimo-pessoal/resultado/_components/personal-loan-resultado.tsx`
- `pessoa-fisica/conta-de-luz/resultado/_components/energy-bill-resultado.tsx`
- `financiamentos/imovel/resultado/_components/property-result.tsx`
- `financiamentos/veiculo/resultado/_components/vehicle-result.tsx`
- `pessoa-juridica/capital-de-giro/resultado/_components/working-capital-resultado.tsx`
- `pessoa-juridica/antecipacao-recebiveis/resultado/_components/receivables-advance-resultado.tsx`

Todos os caminhos relativos a `apps/store/src/app/(store)/simulador/`.

**Padrão de redesign:**

A) Remover o div dark card interno:
```diff
-     <div className="rounded-2xl bg-surface-foreground p-6 text-surface ...">
-       ... dados ...
-     </div>
+     {/* dados diretamente no espaço do card branco do page.tsx */}
```

B) Adicionar import do StoreButton e substituir botão de CTA:
```diff
+ import { StoreButton } from '@/components/ui/store-button'
...
-     <button className="w-full rounded-2xl bg-surface-foreground px-5 py-4 text-sm font-semibold text-surface ...">
+     <StoreButton className="w-full bg-primary text-surface-foreground hover:bg-primary/90" ...>
```

C) Novo layout de dados (substitui o conteúdo do dark card):
```tsx
{/* Valor principal */}
<div>
  <p className="text-sm text-surface-foreground/55">[label do valor]</p>
  <p className="mt-1 text-3xl font-extrabold tracking-tight text-surface-foreground">
    {formatCurrency(valorPrincipal)}
  </p>
  <p className="mt-0.5 text-xs text-surface-foreground/45">[sublabel]</p>
</div>

{/* Highlight pill */}
<div className="flex items-center justify-between rounded-[10px] bg-primary/12 px-4 py-2.5">
  <span className="text-sm font-semibold text-surface-foreground">[label parcela]</span>
  <span className="text-sm font-semibold text-surface-foreground">[valor parcela]</span>
</div>

{/* Divider */}
<div className="h-px bg-surface-foreground/8" />

{/* Rows de dados */}
<div className="space-y-2.5">
  <div className="flex justify-between text-sm">
    <span className="text-surface-foreground/55">Label</span>
    <span className="font-semibold text-surface-foreground">Valor</span>
  </div>
</div>
```

- [ ] **Step 1: Reescrever fgts-resultado.tsx**

```tsx
// apps/store/src/app/(store)/simulador/pessoa-fisica/fgts/resultado/_components/fgts-resultado.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Info, AlertTriangle, RefreshCw, Download } from 'lucide-react'
import { formatCurrency, formatRate } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'
import { StoreButton } from '@/components/ui/store-button'

type Props = { productId: string; productName: string; rateMonthly: number }
type SimData = { nome: string; whatsapp: string; saldoFgts: number }

export function FgtsResultado({ productId, productName, rateMonthly }: Props) {
  const router = useRouter()
  const [data, setData] = useState<SimData | null>(null)
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const stored = sessionStorage.getItem('sim:fgts')
    if (!stored) {
      router.replace(`/simulador/pessoa-fisica/fgts?productId=${productId}`)
      return
    }
    try {
      const parsed: SimData = JSON.parse(stored)
      setData(parsed)
      const SIM_ID_KEY = 'sim:fgts:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        saveSimulation({
          tenantProductId: productId,
          clientName: parsed.nome,
          clientPhone: parsed.whatsapp,
          desiredAmount: parsed.saldoFgts * 0.75,
          desiredTermMonths: 120,
          estimatedRate: rateMonthly,
          estimatedPayment: 0,
          simulationData: parsed as Record<string, unknown>,
        }).then((result) => {
          if (result.success && result.data) {
            setSimulationId(result.data.id)
            sessionStorage.setItem(SIM_ID_KEY, result.data.id)
          }
        })
      }
    } catch {
      router.replace(`/simulador/pessoa-fisica/fgts?productId=${productId}`)
    }
  }, [router, productId, rateMonthly])

  if (!data) {
    return <div className="py-12 text-center text-sm text-surface-foreground/50">Carregando...</div>
  }

  const estimativa = data.saldoFgts * 0.75

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-surface-foreground/55">Valor estimado de antecipação</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-surface-foreground">
          {formatCurrency(estimativa)}
        </p>
        <p className="mt-0.5 text-xs text-surface-foreground/45">75% do saldo informado</p>
      </div>

      <div className="flex items-center justify-between rounded-[10px] bg-primary/12 px-4 py-2.5">
        <span className="text-sm font-semibold text-surface-foreground">Parcelas mensais</span>
        <span className="text-sm font-semibold text-surface-foreground">12× sem custo</span>
      </div>

      <div className="h-px bg-surface-foreground/8" />

      <div className="space-y-2.5">
        <div className="flex justify-between text-sm">
          <span className="text-surface-foreground/55">Saldo FGTS</span>
          <span className="font-semibold text-surface-foreground">{formatCurrency(data.saldoFgts)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-foreground/55">Taxa referencial</span>
          <span className="font-semibold text-surface-foreground">{formatRate(rateMonthly)}% a.m.</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-foreground/55">Prazo máximo</span>
          <span className="font-semibold text-surface-foreground">120 meses</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-surface-foreground/55">Sistema</span>
          <span className="font-semibold text-surface-foreground">PRICE</span>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
        <p className="text-xs leading-relaxed text-surface-foreground/80">
          Valor estimado sujeito a análise e saldo verificado na CEF. Consulte o extrato atualizado no
          aplicativo FGTS ou nas agências da Caixa Econômica Federal.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
        <p className="text-xs leading-relaxed text-primary/80">
          A antecipação do FGTS ({productName}) não tem cobrança de parcelas mensais. O saldo futuro do
          FGTS é utilizado automaticamente para amortizar o valor antecipado.
        </p>
      </div>

      <StoreButton
        className="w-full bg-primary text-surface-foreground hover:bg-primary/90"
        disabled={!simulationId || isQualifying}
        onClick={async () => {
          if (!simulationId) return
          setIsQualifying(true)
          const result = await qualifySimulation(simulationId)
          if (result && !result.success) setIsQualifying(false)
        }}
      >
        {isQualifying ? 'Aguarde...' : simulationId ? 'Quero contratar este crédito →' : 'Carregando...'}
      </StoreButton>

      <div className="flex items-center justify-center gap-6 pt-1">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refazer
        </button>
        <button
          type="button"
          disabled={!simulationId}
          onClick={() => { if (simulationId) window.open(`/api/simulations/${simulationId}/pdf`, '_blank') }}
          className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 transition-colors hover:text-surface-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Download className="h-3.5 w-3.5" /> Baixar PDF
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Reescrever home-equity-resultado.tsx**

As mudanças principais: (1) remover funções calcSAC/calcPRICE inline — importar `calcSAC` e `calcPMT` de `@/lib/utils/simulator`; (2) substituir dark card por layout light.

```tsx
// apps/store/src/app/(store)/simulador/pessoa-fisica/imovel-em-garantia/resultado/_components/home-equity-resultado.tsx
'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, Info, Download } from 'lucide-react'
import { formatCurrency, calcPMT, calcSAC } from '@/lib/utils/simulator'
import { saveSimulation, qualifySimulation } from '@/app/(store)/simulador/actions'
import { StoreButton } from '@/components/ui/store-button'

const PARCELAS_OPTIONS = [60, 120, 180, 240]
type Modalidade = 'SAC' | 'PRICE'

type Props = { productId: string; productName: string; rateMonthly: number; isPj?: boolean }

export function HomeEquityResultado({ productId, rateMonthly, isPj = false }: Props) {
  const router = useRouter()
  const [data, setData] = useState<{ nome: string; whatsapp: string; valorImovel: number; valorCredito: number; parcelas?: number } | null>(null)
  const [parcelas, setParcelas] = useState(240)
  const [modalidade, setModalidade] = useState<Modalidade>('SAC')
  const [simulationId, setSimulationId] = useState<string | null>(null)
  const [isQualifying, setIsQualifying] = useState(false)

  useEffect(() => {
    const key = isPj ? 'sim:home-equity-pj' : 'sim:home-equity'
    const route = isPj ? '/simulador/pessoa-juridica/imovel-em-garantia' : '/simulador/pessoa-fisica/imovel-em-garantia'
    const stored = sessionStorage.getItem(key)
    if (!stored) { router.replace(`${route}?productId=${productId}`); return }
    try {
      const parsed = JSON.parse(stored)
      setData(parsed)
      if (parsed.parcelas) setParcelas(parsed.parcelas)
      const SIM_ID_KEY = isPj ? 'sim:home-equity-pj:id' : 'sim:home-equity:id'
      const existingId = sessionStorage.getItem(SIM_ID_KEY)
      if (existingId) {
        setSimulationId(existingId)
      } else {
        const termMonths = parsed.parcelas ?? 240
        const payment = calcPMT(parsed.valorCredito, rateMonthly, termMonths)
        saveSimulation({
          tenantProductId: productId,
          clientName: parsed.nome,
          clientPhone: parsed.whatsapp ?? '',
          desiredAmount: parsed.valorCredito,
          desiredTermMonths: termMonths,
          estimatedRate: rateMonthly,
          estimatedPayment: payment,
          simulationData: parsed as Record<string, unknown>,
        }).then((result) => {
          if (result.success && result.data) {
            setSimulationId(result.data.id)
            sessionStorage.setItem(SIM_ID_KEY, result.data.id)
          }
        })
      }
    } catch { router.replace(`${route}?productId=${productId}`) }
  }, [router, isPj, productId, rateMonthly])

  const calc = useMemo(() => {
    if (!data) return { firstInstallment: 0, lastInstallment: 0, amortizacao: 0 }
    if (modalidade === 'SAC') {
      const s = calcSAC(data.valorCredito, rateMonthly, parcelas)
      return { firstInstallment: s.first, lastInstallment: s.last, amortizacao: s.amortization }
    }
    const pmt = calcPMT(data.valorCredito, rateMonthly, parcelas)
    return { firstInstallment: pmt, lastInstallment: pmt, amortizacao: null }
  }, [data, rateMonthly, parcelas, modalidade])

  const ltv = data ? Math.round((data.valorCredito / data.valorImovel) * 100) : 0
  const isSAC = modalidade === 'SAC'

  if (!data) {
    return <div className="py-12 text-center text-sm text-surface-foreground/50">Carregando...</div>
  }

  return (
    <div className="space-y-4">
      {/* Parcelas + modalidade */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-surface-foreground/70">Parcelas</label>
          <div className="relative">
            <select
              value={parcelas}
              onChange={(e) => setParcelas(Number(e.target.value))}
              className="h-11 w-full appearance-none rounded-[10px] border border-surface-foreground/15 bg-white px-4 text-sm font-semibold text-surface-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {PARCELAS_OPTIONS.map((n) => <option key={n} value={n}>{n}×</option>)}
            </select>
            <svg className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-surface-foreground/70">Modalidade</label>
          <div className="flex h-11 overflow-hidden rounded-[10px] border border-surface-foreground/15 bg-white">
            {(['SAC', 'PRICE'] as Modalidade[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModalidade(m)}
                className={`flex-1 text-sm font-bold transition-colors ${
                  modalidade === m ? 'bg-surface-foreground text-surface' : 'text-surface-foreground/50 hover:text-surface-foreground'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Valor principal */}
      <div>
        <p className="text-sm text-surface-foreground/55">
          {isSAC ? 'Primeira parcela (decrescente)' : 'Parcela fixa (PRICE)'}
        </p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-surface-foreground">
          {formatCurrency(calc.firstInstallment)}
        </p>
      </div>

      {/* Highlight pill */}
      <div className="flex items-center justify-between rounded-[10px] bg-primary/12 px-4 py-2.5">
        <span className="text-sm font-semibold text-surface-foreground">
          {isSAC ? `${parcelas}× decrescentes` : `${parcelas}× fixas`}
        </span>
        {isSAC && (
          <span className="text-xs text-surface-foreground/60">
            última: {formatCurrency(calc.lastInstallment)}
          </span>
        )}
      </div>

      <div className="h-px bg-surface-foreground/8" />

      <div className="space-y-2.5">
        {[
          { label: 'Crédito', value: formatCurrency(data.valorCredito) },
          { label: 'Valor do imóvel', value: formatCurrency(data.valorImovel) },
          { label: 'Taxa mensal', value: `${rateMonthly.toFixed(2).replace('.', ',')}% a.m.` },
          { label: 'LTV', value: `${ltv}%` },
          { label: 'Sistema', value: modalidade },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-surface-foreground/55">{label}</span>
            <span className="font-semibold text-surface-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary/70" />
        <p className="text-xs text-surface-foreground/65">
          Simulação estimada. A taxa e condições definitivas são apresentadas após análise do seu perfil de crédito.
        </p>
      </div>

      <StoreButton
        className="w-full bg-primary text-surface-foreground hover:bg-primary/90"
        disabled={!simulationId || isQualifying}
        onClick={async () => {
          if (!simulationId) return
          setIsQualifying(true)
          const result = await qualifySimulation(simulationId)
          if (result && !result.success) setIsQualifying(false)
        }}
      >
        {isQualifying ? 'Aguarde...' : simulationId ? 'Quero contratar este crédito →' : 'Carregando...'}
      </StoreButton>

      <div className="flex items-center justify-center gap-6 pt-1">
        <button type="button" onClick={() => router.back()} className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 hover:text-surface-foreground">
          <RefreshCw className="h-3.5 w-3.5" /> Refazer
        </button>
        <button type="button" disabled={!simulationId} onClick={() => { if (simulationId) window.open(`/api/simulations/${simulationId}/pdf`, '_blank') }} className="inline-flex items-center gap-2 text-xs font-medium text-surface-foreground/40 hover:text-surface-foreground disabled:opacity-30">
          <Download className="h-3.5 w-3.5" /> Baixar PDF
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Aplicar o mesmo padrão nos 8 result cards restantes**

Para cada um dos seguintes arquivos, aplicar o padrão descrito acima (remover dark card, importar StoreButton, novo layout de valor principal + highlight pill + data rows + StoreButton):

- `consignado-resultado.tsx` — valor principal = `calcPMT(valorDesejado, rateMonthly, parcelas)` · highlight pill = `${parcelas}× de ${formatCurrency(pmt)}`
- `auto-equity-resultado.tsx` — igual ao home-equity porém com dados do veículo
- `personal-loan-resultado.tsx` — valor principal = valor desejado · parcela = `calcPMT`
- `energy-bill-resultado.tsx` — valor principal = valor solicitado · parcela calculada
- `property-result.tsx` — igual ao home-equity (financiamento imóvel, sistema SAC/PRICE)
- `vehicle-result.tsx` — parcela PRICE sobre valor financiado
- `working-capital-resultado.tsx` — valor desejado + taxa + prazo
- `receivables-advance-resultado.tsx` — valor desejado + taxa + prazo

Em todos: remover `rounded-2xl bg-surface-foreground` dark card, substituir `bg-surface-foreground text-surface` por `bg-primary text-surface-foreground` no botão CTA, importar `StoreButton`.

- [ ] **Step 4: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add "apps/store/src/app/(store)/simulador/"
git commit -m "feat(store): result cards — light card, highlight pill, StoreButton"
```

---

### Task 9: PDF route — calcular parcelas e sistema

**Files:**
- Modify: `apps/store/src/app/api/simulations/[id]/pdf/route.ts`

- [ ] **Step 1: Atualizar o route handler**

```typescript
// apps/store/src/app/api/simulations/[id]/pdf/route.ts
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type JSXElementConstructor, type ReactElement } from 'react'
import { getSimulationForPdf, getTenantBranding } from '@/app/(store)/queries'
import { getTemplate } from '@/templates'
import { SimulationPdf } from '@/lib/pdf/simulation-pdf'
import { calcPriceSchedule } from '@/lib/calc-installments'
import type { PriceInstallment } from '@/lib/calc-installments'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''

  const [simulation, branding] = await Promise.all([
    getSimulationForPdf(id, tenantId),
    getTenantBranding(tenantId),
  ])

  if (!simulation || !simulation.products) {
    return new Response('Not Found', { status: 404 })
  }

  const template = getTemplate(branding?.template_id)
  const { primary } = template.colors

  const productType = Array.isArray(simulation.products.product_type)
    ? simulation.products.product_type[0]
    : simulation.products.product_type
  const slug = (productType as { slug: string } | null)?.slug ?? ''

  const createdAt = simulation.created_at ?? new Date().toISOString()
  const companyName = branding?.company_display_name ?? 'Vello Finance'
  const logoUrl = branding?.logo_url ?? null

  const estimatedAmount = Number(simulation.desired_amount)
  const estimatedRate = simulation.estimated_rate != null ? Number(simulation.estimated_rate) : null
  const estimatedPayment = simulation.estimated_payment != null ? Number(simulation.estimated_payment) : null
  const termMonths = simulation.desired_term_months

  // FGTS não tem tabela de parcelas (desconto direto do saldo)
  const isFgts = slug === 'fgts'
  const installments: PriceInstallment[] =
    !isFgts && estimatedAmount > 0 && estimatedRate !== null && estimatedRate > 0
      ? calcPriceSchedule(estimatedAmount, estimatedRate, termMonths).slice(0, 12)
      : []

  const sistema: 'PRICE' | null = isFgts ? null : 'PRICE'

  const element = createElement(SimulationPdf, {
    simulationId: simulation.id,
    clientName: simulation.client_name,
    productName: simulation.products.name,
    productSlug: slug,
    desiredAmount: estimatedAmount,
    desiredTermMonths: termMonths,
    estimatedRate,
    estimatedPayment,
    simulationData: (simulation.simulation_data as Record<string, unknown>) ?? {},
    createdAt,
    companyName,
    logoUrl,
    primaryL: primary.l,
    primaryC: primary.c,
    primaryH: primary.h,
    sistema,
    installments,
  }) as ReactElement<DocumentProps, string | JSXElementConstructor<unknown>>

  const pdfBuffer = await renderToBuffer(element)

  const date = new Date().toISOString().slice(0, 10)
  const filename = `simulacao-${slug}-${date}.pdf`

  return new Response(new Uint8Array(pdfBuffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  })
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```
Esperado: erro em `SimulationPdf` por falta das props `sistema` e `installments` — será resolvido na Task 10.

- [ ] **Step 3: NÃO commitar ainda** — commitar junto com Task 10.

---

### Task 10: PDF component — redesenho completo

**Files:**
- Modify: `apps/store/src/lib/pdf/simulation-pdf.tsx`

- [ ] **Step 1: Reescrever simulation-pdf.tsx**

```tsx
// apps/store/src/lib/pdf/simulation-pdf.tsx
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { getProductExtras } from './product-extras'
import { oklchToHex } from './oklch-to-rgb'
import type { PriceInstallment } from '@/lib/calc-installments'

type Extra = { label: string; value: string }

export type SimulationPdfProps = {
  simulationId: string
  clientName: string
  productName: string
  productSlug: string
  desiredAmount: number
  desiredTermMonths: number
  estimatedRate: number | null
  estimatedPayment: number | null
  simulationData: Record<string, unknown>
  createdAt: string
  companyName: string
  logoUrl: string | null
  primaryL: number
  primaryC: number
  primaryH: number
  sistema: 'PRICE' | null
  installments: PriceInstallment[]
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
}

// Mistura primary com branco em 10% de opacidade
function primaryLight(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const mix = (c: number) => Math.round(c * 0.12 + 255 * 0.88)
  return `#${mix(r).toString(16).padStart(2,'0')}${mix(g).toString(16).padStart(2,'0')}${mix(b).toString(16).padStart(2,'0')}`
}

export function SimulationPdf({
  simulationId,
  clientName,
  productName,
  productSlug,
  desiredAmount,
  desiredTermMonths,
  estimatedRate,
  estimatedPayment,
  simulationData,
  createdAt,
  companyName,
  logoUrl,
  primaryL,
  primaryC,
  primaryH,
  sistema,
  installments,
}: SimulationPdfProps) {
  const primary = oklchToHex(primaryL, primaryC, primaryH)
  const primaryBg = primaryLight(primary)
  const extras: Extra[] = getProductExtras(productSlug, simulationData)
  const shortId = simulationId.slice(0, 8)
  const dateStr = formatDate(createdAt)
  const rateStr = estimatedRate != null ? `${estimatedRate.toFixed(2).replace('.', ',')}% a.m.` : '—'
  const paymentStr = estimatedPayment != null && estimatedPayment > 0 ? brl(estimatedPayment) : '—'
  const cetAnual = estimatedRate != null
    ? `${((Math.pow(1 + estimatedRate / 100, 12) - 1) * 100).toFixed(1).replace('.', ',')}% a.a.`
    : '—'

  const s = StyleSheet.create({
    page: { backgroundColor: '#ffffff', fontFamily: 'Helvetica' },
    accentBar: { height: 4, backgroundColor: primary },
    content: { paddingHorizontal: 36, paddingTop: 14, paddingBottom: 32 },

    // Header
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', marginBottom: 14,
    },
    logoImage: { height: 26, objectFit: 'contain' },
    logoFallback: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: primary },
    headerRight: { alignItems: 'flex-end' },
    headerLabel: { fontSize: 8, color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase' },
    headerDate: { fontSize: 9, color: '#6b7280', marginTop: 2 },

    // Badge + client
    badge: {
      backgroundColor: primary, borderRadius: 4,
      paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6,
    },
    badgeText: { fontSize: 8, color: '#ffffff', fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
    clientName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 14, letterSpacing: -0.3 },

    // Result box (border-left accent)
    resultBox: {
      borderWidth: 1, borderColor: '#e5e7eb', borderLeftWidth: 4, borderLeftColor: primary,
      borderRadius: 6, padding: 14, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'flex-end',
      marginBottom: 12, backgroundColor: primaryBg,
    },
    resultLabel: { fontSize: 8, color: '#6b7280', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
    resultValue: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
    resultSub: { fontSize: 8, color: '#6b7280', marginTop: 3 },
    resultSecLabel: { fontSize: 8, color: '#6b7280', textAlign: 'right', marginBottom: 2 },
    resultSecValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'right' },

    // Metrics grid
    metricsRow: { flexDirection: 'row', marginBottom: 14 },
    metricCell: {
      flex: 1, backgroundColor: '#f9fafb', borderRadius: 5, padding: 9,
      borderWidth: 1, borderColor: '#e5e7eb', marginRight: 6,
    },
    metricCellLast: {
      flex: 1, backgroundColor: '#f9fafb', borderRadius: 5, padding: 9,
      borderWidth: 1, borderColor: '#e5e7eb',
    },
    metricLabel: { fontSize: 7, color: '#9ca3af', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 3 },
    metricValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' },

    // Section divider
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
    dividerText: {
      fontSize: 7, color: '#9ca3af', fontFamily: 'Helvetica-Bold',
      letterSpacing: 1, marginHorizontal: 8, textTransform: 'uppercase',
    },

    // Extras grid
    extrasGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14 },
    extraCell: {
      width: '48%', borderWidth: 1, borderColor: '#e5e7eb',
      borderRadius: 5, padding: 8, marginRight: '2%', marginBottom: 6,
    },
    extraLabel: { fontSize: 7, color: '#9ca3af', marginBottom: 2 },
    extraValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: '#374151' },

    // Installment table
    tableHeader: { flexDirection: 'row', backgroundColor: primary, borderRadius: 3, marginBottom: 0 },
    tableHeaderCell: {
      flex: 1, paddingVertical: 5, paddingHorizontal: 6,
      fontSize: 7, color: '#ffffff', fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.5, textTransform: 'uppercase', textAlign: 'right',
    },
    tableHeaderCellFirst: { flex: 0.5 },
    tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
    tableRowAlt: { backgroundColor: '#f9fafb' },
    tableCell: { flex: 1, paddingVertical: 4, paddingHorizontal: 6, fontSize: 9, color: '#374151', textAlign: 'right' },
    tableCellFirst: { flex: 0.5, color: '#6b7280', fontSize: 8 },
    tableFooter: { flexDirection: 'row', backgroundColor: primaryBg, borderTopWidth: 2, borderTopColor: primary },
    tableFooterCell: {
      flex: 1, paddingVertical: 5, paddingHorizontal: 6,
      fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a', textAlign: 'right',
    },
    tableFooterCellFirst: { flex: 0.5 },

    // Disclaimer
    disclaimer: {
      backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a',
      borderRadius: 5, padding: 9, marginBottom: 14,
    },
    disclaimerText: { fontSize: 7.5, color: '#78350f', lineHeight: 1.5 },

    // Footer
    footer: {
      flexDirection: 'row', justifyContent: 'space-between',
      borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 10,
    },
    footerText: { fontSize: 7.5, color: '#9ca3af', lineHeight: 1.7 },
    footerRight: { alignItems: 'flex-end' },
  })

  const metrics = [
    { label: 'CRÉDITO', value: brl(desiredAmount) },
    { label: 'PRAZO', value: `${desiredTermMonths} meses` },
    { label: 'TAXA REF.', value: rateStr },
    { label: 'CET ANUAL', value: cetAnual },
  ]

  const sistemaLabel = sistema === 'PRICE' ? 'Sistema PRICE · parcelas fixas' : 'Antecipação · desconto via saldo FGTS'

  const totalJuros = installments.reduce((acc, i) => acc + i.juros, 0)
  const totalAmort = installments.reduce((acc, i) => acc + i.amortizacao, 0)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.accentBar} />
        <View style={s.content}>

          {/* Header */}
          <View style={s.header}>
            <View>
              {logoUrl ? (
                <Image src={logoUrl} style={s.logoImage} />
              ) : (
                <Text style={s.logoFallback}>{companyName}</Text>
              )}
            </View>
            <View style={s.headerRight}>
              <Text style={s.headerLabel}>Simulação de Crédito</Text>
              <Text style={s.headerDate}>{dateStr}</Text>
            </View>
          </View>

          {/* Badge + client */}
          <View style={s.badge}>
            <Text style={s.badgeText}>{productName.toUpperCase()}</Text>
          </View>
          <Text style={s.clientName}>{clientName}</Text>

          {/* Result box */}
          <View style={s.resultBox}>
            <View>
              <Text style={s.resultLabel}>
                {productSlug === 'fgts' ? 'VALOR DISPONÍVEL PARA SAQUE' : 'VALOR DO CRÉDITO'}
              </Text>
              <Text style={s.resultValue}>{brl(desiredAmount)}</Text>
              <Text style={s.resultSub}>{sistemaLabel}</Text>
            </View>
            {estimatedPayment != null && estimatedPayment > 0 && (
              <View>
                <Text style={s.resultSecLabel}>PARCELA MENSAL</Text>
                <Text style={s.resultSecValue}>{paymentStr}</Text>
              </View>
            )}
            {productSlug === 'fgts' && (
              <View>
                <Text style={s.resultSecLabel}>PARCELAS</Text>
                <Text style={s.resultSecValue}>Sem custo</Text>
              </View>
            )}
          </View>

          {/* Metrics */}
          <View style={s.metricsRow}>
            {metrics.map((m, idx) => (
              <View key={m.label} style={idx === metrics.length - 1 ? s.metricCellLast : s.metricCell}>
                <Text style={s.metricLabel}>{m.label}</Text>
                <Text style={s.metricValue}>{m.value}</Text>
              </View>
            ))}
          </View>

          {/* Product extras */}
          {extras.length > 0 && (
            <>
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>DADOS DO PRODUTO</Text>
                <View style={s.dividerLine} />
              </View>
              <View style={s.extrasGrid}>
                {extras.map((e) => (
                  <View key={e.label} style={s.extraCell}>
                    <Text style={s.extraLabel}>{e.label}</Text>
                    <Text style={s.extraValue}>{e.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Installment table */}
          {installments.length > 0 && (
            <>
              <View style={s.dividerRow}>
                <View style={s.dividerLine} />
                <Text style={s.dividerText}>
                  {`TABELA DE PARCELAS — SISTEMA ${sistema ?? 'PRICE'} (primeiras ${installments.length})`}
                </Text>
                <View style={s.dividerLine} />
              </View>
              <View style={s.tableHeader}>
                <Text style={[s.tableHeaderCell, s.tableHeaderCellFirst]}>#</Text>
                <Text style={s.tableHeaderCell}>Juros</Text>
                <Text style={s.tableHeaderCell}>Amortização</Text>
                <Text style={s.tableHeaderCell}>Saldo Devedor</Text>
              </View>
              {installments.map((row, idx) => (
                <View key={row.n} style={[s.tableRow, idx % 2 === 1 ? s.tableRowAlt : {}]}>
                  <Text style={[s.tableCell, s.tableCellFirst]}>{row.n}</Text>
                  <Text style={s.tableCell}>{brl(row.juros)}</Text>
                  <Text style={s.tableCell}>{brl(row.amortizacao)}</Text>
                  <Text style={s.tableCell}>{brl(row.saldoDevedor)}</Text>
                </View>
              ))}
              <View style={s.tableFooter}>
                <Text style={[s.tableFooterCell, s.tableFooterCellFirst]}>Total</Text>
                <Text style={s.tableFooterCell}>{brl(totalJuros)}</Text>
                <Text style={s.tableFooterCell}>{brl(totalAmort)}</Text>
                <Text style={s.tableFooterCell}>—</Text>
              </View>
            </>
          )}

          {/* Disclaimer */}
          <View style={[s.disclaimer, { marginTop: 14 }]}>
            <Text style={s.disclaimerText}>
              {`Esta é uma simulação referencial com base na taxa mínima de ${rateStr}. As condições finais dependem da análise de crédito e das políticas de concessão vigentes. Documento gerado automaticamente — não possui validade jurídica como contrato.`}
            </Text>
          </View>

          {/* Footer */}
          <View style={s.footer}>
            <View>
              <Text style={s.footerText}>{companyName}</Text>
              <Text style={s.footerText}>{`Simulação #${shortId}`}</Text>
            </View>
            <View style={s.footerRight}>
              <Text style={s.footerText}>{`Gerado em ${dateStr}`}</Text>
              <Text style={s.footerText}>Válido por 30 dias · Sujeito à análise de crédito</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | head -20
```
Esperado: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/lib/pdf/simulation-pdf.tsx apps/store/src/app/api/simulations/
git commit -m "feat(store): PDF — redesenho formal branco, tabela PRICE, borda-esq primary"
```

---

## Verificação final

Após todas as tasks:

- [ ] `pnpm tsc --noEmit` no workspace raiz: zero erros
- [ ] Abrir `http://zp.localhost:3000/simulador/pessoa-fisica/fgts` — DotsIndicator visível, inputs h-11
- [ ] Simular FGTS — card de resultado light, botão bg-primary
- [ ] Clicar "Baixar PDF" — PDF branco com borda dourada + tabela de parcelas (FGTS: sem tabela)
- [ ] Abrir `/contratar/fgts` — header com badge/produto + card branco + DotsIndicator
- [ ] Navegar por todos os steps do wizard — sem títulos duplicados, inputs h-11

```bash
git tag design-consistency-v1
```

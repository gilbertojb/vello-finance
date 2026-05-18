# Contratação — Dispatch Final + Migration Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
> **Prerequisites:** Todos os planos anteriores concluídos (shared-steps, etapa2-steps, imovel-wizards, veiculo-wizards, outros-wizards).

**Goal:** (1) Corrigir status `em_analise` na migration. (2) Atualizar `WizardContainer` para despachar para os wizards reais de cada produto.

---

### Task 1: Migration — adicionar status `em_analise`

A action `finalizeEtapa2` define `status: 'em_analise'`, mas a CHECK constraint da migration original não inclui esse valor.

**Files:**
- Create: `supabase/migrations/20260517000002_proposals_add_em_analise_status.sql`

- [ ] **Step 1: Criar migration**

```sql
ALTER TABLE proposals
  DROP CONSTRAINT proposals_status_check;

ALTER TABLE proposals
  ADD CONSTRAINT proposals_status_check
  CHECK (status IN (
    'nova_proposta',
    'proposta_criada',
    'em_analise',
    'pre_aprovada',
    'necessita_detalhes',
    'reprovada',
    'aprovada'
  ));
```

- [ ] **Step 2: Aplicar**

```bash
pnpm supabase db push
```

Expected: migration aplicada sem erros.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260517000002_proposals_add_em_analise_status.sql
git commit -m "fix(database): adicionar status em_analise na constraint de proposals"
```

---

### Task 2: Atualizar `WizardContainer` para despachar aos wizards reais

**Files:**
- Modify: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizard-container.tsx`

Substituir o stub `UnimplementedStep` pelo dispatch para os product wizards.

- [ ] **Step 1: Reescrever `wizard-container.tsx`**

```tsx
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
import type { ProposalWithProduct } from '../../../queries'
import type { ProductWizardProps } from './steps/types'

type Props = {
  productTypeSlug: string
  currentStep: string
  proposal: ProposalWithProduct | null
  product: Awaited<ReturnType<typeof import('../../../queries').getTenantProduct>> | null
  productId: string | null
  simulationId: string | null
}

export function WizardContainer({ productTypeSlug, currentStep, proposal, productId, simulationId }: Props) {
  const flow = PRODUCT_FLOWS[productTypeSlug]
  if (!flow) {
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-8 text-center">
        <p className="text-sm text-surface-foreground/40">Produto não configurado: {productTypeSlug}</p>
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
          steps={flow.etapa1.filter(s => s.slug !== 'retorno')}
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
    case 'home_equity':          return <HomeEquityWizard {...props} />
    case 'home_equity_pj':       return <HomeEquityPJWizard {...props} />
    case 'auto_equity':          return <AutoEquityWizard {...props} />
    case 'auto_equity_pj':       return <AutoEquityPJWizard {...props} />
    case 'fgts':                 return <FgtsWizard {...props} />
    case 'capital_giro':         return <CapitalGiroWizard {...props} />
    case 'antecipacao_recebiveis': return <AntecipacaoRecebiveisWizard {...props} />
    case 'financiamento_imovel': return <FinanciamentoImovelWizard {...props} />
    case 'financiamento_veiculo': return <FinanciamentoVeiculoWizard {...props} />
    case 'consignado_privado':   return <ConsignadoPrivadoWizard {...props} />
    default:
      return <p className="text-sm text-surface-foreground/40">Wizard não implementado: {slug}</p>
  }
}
```

- [ ] **Step 2: Build final**

```bash
pnpm --filter @vello/store build 2>&1 | tail -20
```

Expected: build passa sem erros de tipo.

- [ ] **Step 3: Verificar rota manualmente**

Acessar `http://localhost:3000/contratar/home-equity?productId=<uuid>` (substitua pelo UUID de um produto ativo do tenant de desenvolvimento).

Expected: Step `operacao` do CGI PF renderizado com campos de tipo de imóvel, financiado, matrícula e motivo.

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): WizardContainer despacha para todos os wizards de produto"
```

---

### Task 3: Verificação de integração end-to-end

- [ ] **Step 1: Testar fluxo CGI PF**

1. Acessar `/contratar/home-equity?productId=<uuid>`
2. Preencher operacao → verificar redirecionamento com `proposalId` na URL
3. Preencher dados-pessoais → verificar avanço
4. Verificar StepIndicator atualiza progresso
5. Completar até retorno → verificar status `proposta_criada` no Supabase

```bash
# Verificar proposal no banco
pnpm supabase db remote commit --dry-run 2>/dev/null; echo "---"
# Ou via Studio: Table Editor → proposals → filtrar por status
```

- [ ] **Step 2: Testar fluxo FGTS**

1. Acessar `/contratar/fgts?productId=<uuid>` (sem simulationId)
2. Verificar renderização do step `liberacao-saque`
3. Responder "Não" → verificar instrução passo a passo aparece
4. Clicar "Já realizei" → verificar botão Prosseguir habilitado

- [ ] **Step 3: Testar Etapa 2**

1. Com proposta em status `proposta_criada`, acessar `/proposta/<id>/documentos`
2. Verificar step `dados-bancarios` renderizado
3. Preencher dados e prosseguir → verificar step `documentos-pessoais`
4. Upload de arquivo de teste → verificar arquivo no bucket `proposal-documents` no Supabase Storage

- [ ] **Step 4: Testar bloqueio**

Acessar `/contratar/auto-equity`, selecionar "Sim" em "Veículo financiado?":
Expected: `BlockMessage` aparece, botão Prosseguir desabilitado.

- [ ] **Step 5: Commit final**

```bash
git add .
git commit -m "feat(store): fluxos de contratação completos — todos os 10 produtos"
```

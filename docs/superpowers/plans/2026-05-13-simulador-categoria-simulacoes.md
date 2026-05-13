# Simulador — Categorias, Limites do DB e Simulações

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar o simulador 100% funcional: categorias via DB, limites/taxas/prazos dinâmicos do produto, gravação automática de simulações e fluxo de pré-qualificação ao clicar em "Quero contratar".

**Architecture:** Duas migrations (category em product_types + tabela simulations). Server Components passam limites do produto como props aos Client Components. Resultado components salvam simulação via Server Action no mount. CTA "Quero contratar" chama Server Action que atualiza status para `pre_qualificado` e redireciona para `/agradecimento`. Fluxo `/solicitar` removido.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL), Tailwind CSS.

---

## Task 1: Migrations + Regenerar Types

**Files:**
- Create: `supabase/migrations/20260513130000_add_category_product_types.sql`
- Create: `supabase/migrations/20260513140000_create_simulations.sql`
- Modify: `packages/database/src/types.ts` (gerado automaticamente)

- [ ] **Step 1.1: Criar migration de category**

```sql
-- supabase/migrations/20260513130000_add_category_product_types.sql
ALTER TABLE product_types
  ADD COLUMN category TEXT CHECK (
    category IN ('pessoa_fisica','pessoa_juridica','financiamentos')
  );

UPDATE product_types SET category = 'pessoa_fisica'
  WHERE slug IN ('fgts','consignado_publico','consignado_privado',
                 'home_equity','auto_equity','emprestimo_pessoal','conta_luz','outros');

UPDATE product_types SET category = 'pessoa_juridica'
  WHERE slug IN ('home_equity_pj','auto_equity_pj',
                 'capital_giro','antecipacao_recebiveis');

UPDATE product_types SET category = 'financiamentos'
  WHERE slug IN ('financiamento_imovel','financiamento_veiculo');
```

- [ ] **Step 1.2: Criar migration da tabela simulations**

```sql
-- supabase/migrations/20260513140000_create_simulations.sql
CREATE TABLE simulations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  client_name         TEXT NOT NULL,
  client_phone        TEXT NOT NULL,
  desired_amount      NUMERIC(12,2) NOT NULL,
  desired_term_months INT NOT NULL,
  estimated_rate      NUMERIC(6,4),
  estimated_payment   NUMERIC(12,2),
  simulation_data     JSONB,
  status              TEXT NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN ('rascunho','pre_qualificado')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_simulations
  BEFORE UPDATE ON simulations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_simulations_tenant_status ON simulations(tenant_id, status);
CREATE INDEX idx_simulations_tenant_created ON simulations(tenant_id, created_at DESC);

ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON simulations FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "backoffice_full_access" ON simulations FOR ALL
  USING ((auth.jwt() ->> 'user_role') = ANY(
    ARRAY['super_admin','admin','financial','support']
  ));
```

- [ ] **Step 1.3: Aplicar migrations**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm supabase db push
```

- [ ] **Step 1.4: Regenerar types**

```bash
pnpm db:types
```

Verificar que `packages/database/src/types.ts` agora contém:
- `product_types.Row.category: string | null`
- Interface `simulations` com todos os campos

- [ ] **Step 1.5: Commit**

```bash
git add supabase/migrations/20260513130000_add_category_product_types.sql
git add supabase/migrations/20260513140000_create_simulations.sql
git add packages/database/src/types.ts
git commit -m "feat(store): migration category product_types e tabela simulations"
```

---

## Task 2: Queries + Server Actions

**Files:**
- Modify: `apps/store/src/app/(store)/queries.ts`
- Create: `apps/store/src/app/(store)/simulador/actions.ts`

- [ ] **Step 2.1: Adicionar `listActiveProductsByCategory` em queries.ts**

Abra `apps/store/src/app/(store)/queries.ts` e adicione após `listActiveProducts`:

```ts
export async function listActiveProductsByCategory(
  tenantId: string,
  category: 'pessoa_fisica' | 'pessoa_juridica' | 'financiamentos',
) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_products')
    .select(`
      id,
      cover_url,
      products (
        id,
        name,
        description,
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly,
        product_type:product_types ( slug, category )
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .eq('products.product_types.category', category)
    .order('created_at')
  return (data ?? []).filter((tp) => tp.products !== null)
}
```

- [ ] **Step 2.2: Adicionar `getSimulation` em queries.ts**

```ts
export async function getSimulation(simulationId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      desired_amount,
      desired_term_months,
      status,
      products ( name )
    `)
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}
```

- [ ] **Step 2.3: Remover `getProposalConfirmation` de queries.ts**

Apague a função `getProposalConfirmation` inteira do arquivo.

- [ ] **Step 2.4: Criar `apps/store/src/app/(store)/simulador/actions.ts`**

```ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

export async function saveSimulation(input: {
  tenantProductId: string
  clientName: string
  clientPhone: string
  desiredAmount: number
  desiredTermMonths: number
  estimatedRate: number
  estimatedPayment: number
  simulationData: Record<string, unknown>
}): Promise<string | null> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return null

  const supabase = createServiceClient()

  const { data: tp } = await supabase
    .from('tenant_products')
    .select('product_id')
    .eq('id', input.tenantProductId)
    .eq('tenant_id', tenantId)
    .single()

  if (!tp) return null

  const { data, error } = await supabase
    .from('simulations')
    .insert({
      tenant_id: tenantId,
      product_id: tp.product_id,
      client_name: input.clientName,
      client_phone: input.clientPhone,
      desired_amount: input.desiredAmount,
      desired_term_months: input.desiredTermMonths,
      estimated_rate: input.estimatedRate,
      estimated_payment: input.estimatedPayment,
      simulation_data: input.simulationData,
      status: 'rascunho',
    })
    .select('id')
    .single()

  if (error || !data) return null
  return data.id
}

export async function qualifySimulation(simulationId: string): Promise<void> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return

  const supabase = createServiceClient()
  await supabase
    .from('simulations')
    .update({ status: 'pre_qualificado' })
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)

  redirect(`/agradecimento/${simulationId}`)
}
```

- [ ] **Step 2.5: Commit**

```bash
git add apps/store/src/app/(store)/queries.ts
git add apps/store/src/app/(store)/simulador/actions.ts
git commit -m "feat(store): queries por categoria e server actions de simulacao"
```

---

## Task 3: Páginas Seletoras — filtrar por categoria

**Files:**
- Modify: `apps/store/src/app/(store)/simulador/pessoa-fisica/page.tsx`
- Modify: `apps/store/src/app/(store)/simulador/pessoa-juridica/page.tsx`
- Modify: `apps/store/src/app/(store)/simulador/financiamentos/page.tsx`

- [ ] **Step 3.1: Atualizar `pessoa-fisica/page.tsx`**

Substituir o conteúdo por:

```tsx
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listActiveProductsByCategory } from '../../queries'
import { ProdutoSelector } from '../../_components/produto-selector'
import { SimuladorStepIndicator } from '../../_components/simulador-step-indicator'

export const metadata: Metadata = { title: 'Crédito Pessoa Física' }

const SLUG_TO_ROUTE: Record<string, string> = {
  home_equity:       '/simulador/pessoa-fisica/home-equity',
  auto_equity:       '/simulador/pessoa-fisica/auto-equity',
  fgts:              '/simulador/pessoa-fisica/fgts',
  emprestimo_pessoal:'/simulador/pessoa-fisica/emprestimo-pessoal',
  conta_luz:         '/simulador/pessoa-fisica/conta-luz',
}

export default async function PessoaFisicaPage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const products = await listActiveProductsByCategory(tenantId, 'pessoa_fisica')

  const options = products.map((tp) => {
    const slug = (tp.products!.product_type as { slug: string }).slug
    const route = SLUG_TO_ROUTE[slug] ?? `/produto/${tp.id}`
    return {
      tenantProductId: tp.id,
      label: tp.products!.name,
      productName: tp.products!.name,
      href: `${route}?productId=${tp.id}`,
    }
  })

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-foreground/55 transition-colors hover:text-surface-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
        <div className="mb-10"><SimuladorStepIndicator currentStep={1} /></div>
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
```

- [ ] **Step 3.2: Atualizar `pessoa-juridica/page.tsx`**

Mesma estrutura. Mudar `listActiveProductsByCategory(tenantId, 'pessoa_juridica')` e o `SLUG_TO_ROUTE`:

```tsx
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listActiveProductsByCategory } from '../../queries'
import { ProdutoSelector } from '../../_components/produto-selector'
import { SimuladorStepIndicator } from '../../_components/simulador-step-indicator'

export const metadata: Metadata = { title: 'Crédito Pessoa Jurídica' }

const SLUG_TO_ROUTE: Record<string, string> = {
  home_equity_pj:          '/simulador/pessoa-juridica/home-equity-pj',
  auto_equity_pj:          '/simulador/pessoa-juridica/auto-equity-pj',
  antecipacao_recebiveis:  '/simulador/pessoa-juridica/antecipacao-recebiveis',
  capital_giro:            '/simulador/pessoa-juridica/capital-giro',
}

export default async function PessoaJuridicaPage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const products = await listActiveProductsByCategory(tenantId, 'pessoa_juridica')

  const options = products.map((tp) => {
    const slug = (tp.products!.product_type as { slug: string }).slug
    const route = SLUG_TO_ROUTE[slug] ?? `/produto/${tp.id}`
    return {
      tenantProductId: tp.id,
      label: tp.products!.name,
      productName: tp.products!.name,
      href: `${route}?productId=${tp.id}`,
    }
  })

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-foreground/55 transition-colors hover:text-surface-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
        <div className="mb-10"><SimuladorStepIndicator currentStep={1} /></div>
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-10 max-sm:p-6">
          <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.03_85)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[oklch(0.48_0.07_50)]">
            Crédito Pessoa Jurídica
          </span>
          <h2 className="mb-2 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Qual crédito você está buscando?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/55">
            Escolha o produto mais adequado para sua empresa. Simulação gratuita, sem cadastro e sem compromisso.
          </p>
          <ProdutoSelector options={options} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3.3: Atualizar `financiamentos/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { listActiveProductsByCategory } from '../../queries'
import { ProdutoSelector } from '../../_components/produto-selector'
import { SimuladorStepIndicator } from '../../_components/simulador-step-indicator'

export const metadata: Metadata = { title: 'Financiamentos' }

const SLUG_TO_ROUTE: Record<string, string> = {
  financiamento_imovel:  '/simulador/financiamentos/imovel',
  financiamento_veiculo: '/simulador/financiamentos/veiculo',
}

export default async function FinanciamentosPage() {
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const products = await listActiveProductsByCategory(tenantId, 'financiamentos')

  const options = products.map((tp) => {
    const slug = (tp.products!.product_type as { slug: string }).slug
    const route = SLUG_TO_ROUTE[slug] ?? `/produto/${tp.id}`
    return {
      tenantProductId: tp.id,
      label: tp.products!.name,
      productName: tp.products!.name,
      href: `${route}?productId=${tp.id}`,
    }
  })

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-surface-foreground/55 transition-colors hover:text-surface-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </Link>
        <div className="mb-10"><SimuladorStepIndicator currentStep={1} /></div>
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-10 max-sm:p-6">
          <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.03_85)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[oklch(0.48_0.07_50)]">
            Financiamentos
          </span>
          <h2 className="mb-2 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Qual financiamento você está buscando?
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/55">
            Escolha a linha mais adequada para você. Simulação gratuita, sem cadastro e sem compromisso.
          </p>
          <ProdutoSelector options={options} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3.4: Commit**

```bash
git add apps/store/src/app/\(store\)/simulador/pessoa-fisica/page.tsx
git add apps/store/src/app/\(store\)/simulador/pessoa-juridica/page.tsx
git add apps/store/src/app/\(store\)/simulador/financiamentos/page.tsx
git commit -m "feat(store): seletores de produto por categoria do DB"
```

---

## Task 4: Form Pages — Passar Limites como Props

**Files (todos os `page.tsx` de formulário — 10 arquivos):**

A mudança é a mesma em todos: extrair `min_amount`, `max_amount`,
`min_term_months`, `max_term_months` de `tp.products` e passar ao form component.

- [ ] **Step 4.1: Padrão de mudança nos form pages**

Em cada `page.tsx` de formulário, localizar a linha onde o form component é
invocado e adicionar as props de limites. Exemplo para `emprestimo-pessoal/page.tsx`:

**Antes:**
```tsx
<EmprestimoPessoalForm productId={productId} />
```

**Depois:**
```tsx
<EmprestimoPessoalForm
  productId={productId}
  minTermMonths={tp.products.min_term_months ?? 6}
  maxTermMonths={tp.products.max_term_months ?? 48}
  maxAmount={tp.products.max_amount ?? undefined}
  minAmount={tp.products.min_amount ?? undefined}
/>
```

Fallbacks padrão por produto (usar como `?? fallback` quando o campo for null):

| Produto | minTermMonths | maxTermMonths | maxAmount | minAmount |
|---|---|---|---|---|
| `fgts` | — (sem parcelas) | — | — | — |
| `emprestimo_pessoal` | 6 | 48 | 10000 | undefined |
| `conta_luz` | 6 | 24 | 2100 | undefined |
| `home_equity` | 12 | 240 | undefined | 150000 |
| `auto_equity` | 12 | 90 | undefined | 10000 |
| `home_equity_pj` | 12 | 240 | undefined | 150000 |
| `auto_equity_pj` | 12 | 90 | undefined | 10000 |
| `antecipacao_recebiveis` | 6 | 24 | undefined | undefined |
| `capital_giro` | 12 | 48 | undefined | undefined |
| `financiamento_imovel` | 60 | 360 | undefined | 150000 |
| `financiamento_veiculo` | 12 | 60 | undefined | 10000 |

- [ ] **Step 4.2: Aplicar em todos os 10 form pages**

Arquivos a modificar:
1. `apps/store/src/app/(store)/simulador/pessoa-fisica/fgts/page.tsx` — apenas `minRateMonthly={tp.products.min_rate_monthly ?? 1.70}` (sem limites de valor/prazo)
2. `apps/store/src/app/(store)/simulador/pessoa-fisica/emprestimo-pessoal/page.tsx`
3. `apps/store/src/app/(store)/simulador/pessoa-fisica/conta-luz/page.tsx`
4. `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/page.tsx`
5. `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/page.tsx`
6. `apps/store/src/app/(store)/simulador/pessoa-juridica/home-equity-pj/page.tsx`
7. `apps/store/src/app/(store)/simulador/pessoa-juridica/auto-equity-pj/page.tsx`
8. `apps/store/src/app/(store)/simulador/pessoa-juridica/antecipacao-recebiveis/page.tsx`
9. `apps/store/src/app/(store)/simulador/pessoa-juridica/capital-giro/page.tsx`
10. `apps/store/src/app/(store)/simulador/financiamentos/imovel/page.tsx`
11. `apps/store/src/app/(store)/simulador/financiamentos/veiculo/page.tsx`

- [ ] **Step 4.3: Commit**

```bash
git add apps/store/src/app/\(store\)/simulador/
git commit -m "feat(store): form pages passam limites do produto como props"
```

---

## Task 5: Form Components — Usar Limites do DB

**Files (todos os form components — 9 arquivos, pois home-equity-pj e auto-equity-pj reutilizam os PF):**

A mudança em cada form component segue o mesmo padrão:
1. Adicionar props de limites na interface `Props`
2. Substituir array hardcoded de parcelas por `generateTermOptions`
3. Substituir constantes hardcoded de valor por props

- [ ] **Step 5.1: Padrão de mudança — exemplo `emprestimo-pessoal-form.tsx`**

**Props interface — adicionar:**
```ts
type Props = {
  productId: string
  minTermMonths: number
  maxTermMonths: number
  maxAmount?: number
  minAmount?: number
}
```

**Parcelas dinâmicas — substituir:**
```ts
// Antes:
const PARCELAS_OPTIONS = [6, 12, 18, 24, 36, 48]

// Depois (dentro do componente, após imports):
import { generateTermOptions, formatCurrency } from '@/lib/utils/simulator'
// ...
const PARCELAS_OPTIONS = useMemo(
  () => generateTermOptions(minTermMonths, maxTermMonths),
  [minTermMonths, maxTermMonths],
)
```

**Validação de valor — substituir:**
```ts
// Antes:
const MAX_VALOR = 10000
// ...
if (valorCreditoTyped > MAX_VALOR) { /* ajuste */ }

// Depois:
const teto = maxAmount ?? 10000
// ...
if (valorCreditoTyped > teto) { /* ajuste */ }
```

**Aviso — atualizar texto:**
```tsx
// Antes: "Valor máximo: R$ 10.000,00"
// Depois:
`Valor máximo: ${formatCurrency(teto)}`
```

- [ ] **Step 5.2: Aplicar em todos os 9 form components**

Arquivos a modificar:
1. `apps/store/src/app/(store)/simulador/pessoa-fisica/fgts/_components/fgts-form.tsx` — apenas adicionar prop `minRateMonthly` (sem mudança de parcelas/valor)
2. `apps/store/src/app/(store)/simulador/pessoa-fisica/emprestimo-pessoal/_components/emprestimo-pessoal-form.tsx`
3. `apps/store/src/app/(store)/simulador/pessoa-fisica/conta-luz/_components/conta-luz-form.tsx` — maxAmount=2100
4. `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/_components/home-equity-form.tsx` — minAmount como limite mínimo; LTV 50% mantido
5. `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/_components/auto-equity-form.tsx` — LTV 70% mantido; minAmount como valor mínimo da FIPE
6. `apps/store/src/app/(store)/simulador/pessoa-juridica/antecipacao-recebiveis/_components/antecipacao-recebiveis-form.tsx`
7. `apps/store/src/app/(store)/simulador/pessoa-juridica/capital-giro/_components/capital-giro-form.tsx`
8. `apps/store/src/app/(store)/simulador/financiamentos/imovel/_components/financiamento-imovel-form.tsx` — minAmount como valor mínimo do imóvel
9. `apps/store/src/app/(store)/simulador/financiamentos/veiculo/_components/financiamento-veiculo-form.tsx`

**Nota sobre home-equity e auto-equity:** Esses componentes aceitam `isPj?: boolean`.
As props de limite são as mesmas — o form page PJ passa os limites da mesma forma.

- [ ] **Step 5.3: Commit**

```bash
git add apps/store/src/app/\(store\)/simulador/
git commit -m "feat(store): form components usam limites e prazos do DB"
```

---

## Task 6: Resultado Components — Auto-save + Qualify

**Files (9 resultado components com `_components/` próprio):**

A mudança segue o mesmo padrão em todos os 9 componentes.

- [ ] **Step 6.1: Padrão de mudança — exemplo `emprestimo-pessoal-resultado.tsx`**

**Adicionar imports:**
```ts
import { saveSimulation, qualifySimulation } from '../../../../actions'
```

**Adicionar `simulationId` ao state e `isQualifying`:**
```ts
const [simulationId, setSimulationId] = useState<string | null>(null)
const [isQualifying, setIsQualifying] = useState(false)
```

**No `useEffect`, após `setData(parsed)` e `setParcelas(parsed.parcelas)`, adicionar:**
```ts
const SIM_ID_KEY = 'sim:emprestimo-pessoal:id'
const existingId = sessionStorage.getItem(SIM_ID_KEY)
if (existingId) {
  setSimulationId(existingId)
} else {
  const payment = calcPMT(parsed.valorDesejado, rateMonthly, parsed.parcelas)
  saveSimulation({
    tenantProductId: productId,
    clientName: parsed.nome,
    clientPhone: parsed.whatsapp,
    desiredAmount: parsed.valorDesejado,
    desiredTermMonths: parsed.parcelas,
    estimatedRate: rateMonthly,
    estimatedPayment: payment,
    simulationData: parsed as Record<string, unknown>,
  }).then((id) => {
    if (id) {
      sessionStorage.setItem(SIM_ID_KEY, id)
      setSimulationId(id)
    }
  })
}
```

**Substituir botão "Quero contratar":**
```tsx
// Antes:
<button
  type="button"
  onClick={() => router.push(`/solicitar/${productId}?amount=...`)}
  className="w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
>
  Quero contratar este crédito →
</button>

// Depois:
<button
  type="button"
  disabled={!simulationId || isQualifying}
  onClick={async () => {
    if (!simulationId) return
    setIsQualifying(true)
    await qualifySimulation(simulationId)
  }}
  className="w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90 disabled:opacity-40"
>
  {isQualifying ? 'Aguarde...' : simulationId ? 'Quero contratar este crédito →' : 'Carregando...'}
</button>
```

**Chave sessionStorage por produto:**

| Componente | SIM_ID_KEY | campo `desiredAmount` | campo `desiredTermMonths` |
|---|---|---|---|
| `fgts-resultado` | `sim:fgts:id` | `saldoFgts * 0.75` | `120` (fixo) |
| `emprestimo-pessoal-resultado` | `sim:emprestimo-pessoal:id` | `valorDesejado` | `parcelas` |
| `conta-luz-resultado` | `sim:conta-luz:id` | `valorDesejado` | `parcelas` |
| `home-equity-resultado` | `sim:home-equity:id` ou `sim:home-equity-pj:id` se `isPj` | `valorCredito` | `parcelas` |
| `auto-equity-resultado` | `sim:auto-equity:id` ou `sim:auto-equity-pj:id` se `isPj` | `valorCredito` | `parcelas` |
| `antecipacao-recebiveis-resultado` | `sim:antecipacao-recebiveis:id` | `valorCredito` | `parcelas` |
| `capital-giro-resultado` | `sim:capital-giro:id` | `valorDesejado` | `parcelas` |
| `financiamento-imovel-resultado` | `sim:financiamento-imovel:id` | `valorImovel - entrada` | `parcelas` |
| `financiamento-veiculo-resultado` | `sim:financiamento-veiculo:id` | `valorVeiculo - entrada` | `parcelas` |

**Nota FGTS:** Não usa `calcPMT`. `estimatedPayment` = 0 (não há parcela calculada).
`desiredAmount` = `saldoFgts * 0.75`. `desiredTermMonths` = 120.

**Nota home-equity/auto-equity:** Esses componentes têm `isPj` prop.
O `SIM_ID_KEY` é condicional: `isPj ? 'sim:home-equity-pj:id' : 'sim:home-equity:id'`.
O `tenantProductId` passado ao `saveSimulation` é o `productId` prop (correto — é o
tenantProductId da URL, que corresponde ao PF ou PJ conforme a página que instanciou).

- [ ] **Step 6.2: Aplicar em todos os 9 resultado components**

Arquivos a modificar:
1. `apps/store/src/app/(store)/simulador/pessoa-fisica/fgts/resultado/_components/fgts-resultado.tsx`
2. `apps/store/src/app/(store)/simulador/pessoa-fisica/emprestimo-pessoal/resultado/_components/emprestimo-pessoal-resultado.tsx`
3. `apps/store/src/app/(store)/simulador/pessoa-fisica/conta-luz/resultado/_components/conta-luz-resultado.tsx`
4. `apps/store/src/app/(store)/simulador/pessoa-fisica/home-equity/resultado/_components/home-equity-resultado.tsx`
5. `apps/store/src/app/(store)/simulador/pessoa-fisica/auto-equity/resultado/_components/auto-equity-resultado.tsx`
6. `apps/store/src/app/(store)/simulador/pessoa-juridica/antecipacao-recebiveis/resultado/_components/antecipacao-recebiveis-resultado.tsx`
7. `apps/store/src/app/(store)/simulador/pessoa-juridica/capital-giro/resultado/_components/capital-giro-resultado.tsx`
8. `apps/store/src/app/(store)/simulador/financiamentos/imovel/resultado/_components/financiamento-imovel-resultado.tsx`
9. `apps/store/src/app/(store)/simulador/financiamentos/veiculo/resultado/_components/financiamento-veiculo-resultado.tsx`

- [ ] **Step 6.3: Commit**

```bash
git add apps/store/src/app/\(store\)/simulador/
git commit -m "feat(store): resultado auto-salva simulacao e qualifica ao contratar"
```

---

## Task 7: Página `/agradecimento/[id]`

**Files:**
- Create: `apps/store/src/app/(store)/agradecimento/[id]/page.tsx`

- [ ] **Step 7.1: Criar a página**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { getSimulation } from '../../../queries'

export const metadata: Metadata = { title: 'Solicitação recebida' }

type Props = { params: Promise<{ id: string }> }

export default async function AgradecimentoPage({ params }: Props) {
  const { id } = await params
  const tenantId = (await headers()).get('x-tenant-id') ?? ''
  const simulation = await getSimulation(id, tenantId)
  if (!simulation) notFound()

  const productName = (simulation.products as { name: string } | null)?.name ?? 'Crédito'

  return (
    <div className="min-h-[calc(100vh-78px)] bg-surface py-12 text-surface-foreground">
      <div className="mx-auto max-w-2xl px-8">
        <div className="rounded-[22px] border border-black/[0.06] bg-white p-10 text-center max-sm:p-6">
          <div className="mb-6 flex justify-center">
            <CheckCircle className="h-14 w-14 text-green-500" />
          </div>
          <span className="inline-flex items-center rounded-full bg-[oklch(0.96_0.03_85)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[.18em] text-[oklch(0.48_0.07_50)]">
            {productName}
          </span>
          <h2 className="mb-3 mt-5 text-[26px] font-bold leading-tight tracking-tight text-surface-foreground">
            Recebemos seu interesse!
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-surface-foreground/60">
            Olá, <strong className="text-surface-foreground">{simulation.client_name}</strong>!
            Um de nossos consultores vai entrar em contato pelo seu WhatsApp em breve para
            dar continuidade à sua solicitação de <strong>{productName}</strong>.
          </p>
          <Link
            href="/"
            className="inline-flex items-center rounded-2xl bg-background px-6 py-3.5 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7.2: Commit**

```bash
git add apps/store/src/app/\(store\)/agradecimento/
git commit -m "feat(store): pagina de agradecimento pos-qualificacao"
```

---

## Task 8: Remover `/solicitar` e `/confirmacao`

**Files:**
- Delete: `apps/store/src/app/(store)/solicitar/` (diretório inteiro)
- Delete: `apps/store/src/app/(store)/confirmacao/` (diretório inteiro)

- [ ] **Step 8.1: Remover diretórios**

```bash
rm -rf apps/store/src/app/\(store\)/solicitar
rm -rf apps/store/src/app/\(store\)/confirmacao
```

- [ ] **Step 8.2: Verificar referências restantes**

```bash
grep -r "solicitar\|confirmacao\|getProposalConfirmation\|createProposal" \
  apps/store/src/ --include="*.ts" --include="*.tsx" -l
```

Não deve retornar nenhum arquivo. Se retornar, remover as referências.

- [ ] **Step 8.3: Commit**

```bash
git add -A
git commit -m "chore(store): remove fluxo solicitar e confirmacao"
```

---

## Task 9: Push

- [ ] **Step 9.1: Push para origin**

```bash
git push origin main
```

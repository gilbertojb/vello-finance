# Contratação — Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **NOTE UI:** Use the `frontend-design` skill before implementing any Client Component that renders a form or UI. The existing design system uses `rounded-2xl` inputs, CSS custom vars (`text-surface-foreground`, `bg-background`, `text-primary`, `border-surface-foreground/15`), no form library — plain `useState`.

**Goal:** Criar a infraestrutura completa do fluxo de contratação: migration, Server Actions, componentes compartilhados e routing base que todos os produtos utilizam.

**Architecture:** Wizard multi-step com `?step=slug&proposalId=uuid` como searchParams. Cada step é um Client Component que chama uma Server Action; a action salva no Supabase e redireciona para o próximo step. Proposals persistidas incrementalmente — cada `saveStep` faz merge no campo `form_data JSONB`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (Postgres + Storage + service role), Zod, Tailwind CSS (custom design tokens), `headers()` para `x-tenant-id`.

**Spec:** `docs/features/store/contratar/ARCHITECTURE.md`

---

### Task 1: Migration — tabelas `proposals` e `proposal_documents`

**Files:**
- Create: `supabase/migrations/20260517000000_create_proposals_tables.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260517000000_create_proposals_tables.sql

-- ============================================================
-- proposals
-- ============================================================
CREATE TABLE proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  product_type_slug   TEXT NOT NULL,
  simulation_id       UUID REFERENCES simulations(id),
  status              TEXT NOT NULL DEFAULT 'nova_proposta'
    CHECK (status IN (
      'nova_proposta',
      'proposta_criada',
      'pre_aprovada',
      'necessita_detalhes',
      'reprovada',
      'aprovada'
    )),
  current_step        TEXT NOT NULL DEFAULT 'operacao',
  client_name         TEXT,
  client_phone        TEXT,
  form_data           JSONB NOT NULL DEFAULT '{}',
  documents_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Service role: acesso total (todas as Server Actions usam service role)
CREATE POLICY "proposals_service_role" ON proposals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Console operators: leitura por tenant
CREATE POLICY "proposals_tenant_select" ON proposals
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ============================================================
-- proposal_documents
-- ============================================================
CREATE TABLE proposal_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  file_name       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_documents_service_role" ON proposal_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "proposal_documents_tenant_select" ON proposal_documents
  FOR SELECT USING (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ============================================================
-- updated_at trigger (reutiliza função se já existe)
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Storage bucket (privado) para documentos de propostas
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-documents', 'proposal-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "proposal_documents_upload"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'proposal-documents');

CREATE POLICY "proposal_documents_read"
  ON storage.objects FOR SELECT TO service_role
  USING (bucket_id = 'proposal-documents');

CREATE POLICY "proposal_documents_delete"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'proposal-documents');
```

- [ ] **Step 2: Aplicar a migration**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm supabase db push
```

Expected: migration applied sem erros. Se houver erro de função `update_updated_at_column` já existente, o `CREATE OR REPLACE` já trata isso.

- [ ] **Step 3: Verificar tabelas no Supabase Studio**

Abrir Supabase Studio → Table Editor → confirmar `proposals` e `proposal_documents` existem com as colunas corretas.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260517000000_create_proposals_tables.sql
git commit -m "feat(store): migration — tabelas proposals e proposal_documents"
```

---

### Task 2: Regenerar DB types

**Files:**
- Modify: `packages/database/src/types.ts` (gerado automaticamente)

- [ ] **Step 1: Rodar regeneração de types**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm db:types
```

- [ ] **Step 2: Verificar que proposals aparece no tipo gerado**

```bash
grep -n "proposals" packages/database/src/types.ts | head -20
```

Expected: linhas com `proposals: { Row: { ... } }` no schema `public`.

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/types.ts
git commit -m "chore(database): regenerar types após migration proposals"
```

---

### Task 3: Queries — `getProposal` e helpers

**Files:**
- Modify: `apps/store/src/app/(store)/queries.ts`

- [ ] **Step 1: Adicionar query `getProposal` ao arquivo existente**

Abrir `apps/store/src/app/(store)/queries.ts` e adicionar ao final:

```typescript
export async function getProposal(proposalId: string, tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('proposals')
    .select(`
      id,
      product_id,
      product_type_slug,
      simulation_id,
      status,
      current_step,
      client_name,
      client_phone,
      form_data,
      documents_submitted,
      created_at,
      products (
        id,
        name,
        min_amount,
        max_amount,
        min_term_months,
        max_term_months,
        min_rate_monthly,
        max_rate_monthly,
        product_type:product_types ( slug )
      )
    `)
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export type ProposalWithProduct = NonNullable<Awaited<ReturnType<typeof getProposal>>>
```

- [ ] **Step 2: Verificar que o arquivo compila**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | head -30
```

Expected: sem erros de tipo relacionados ao arquivo de queries.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/queries.ts
git commit -m "feat(store): adicionar query getProposal"
```

---

### Task 4: Server Actions — `createProposal` e `saveStep`

**Files:**
- Create: `apps/store/src/app/(store)/contratar/actions.ts`

- [ ] **Step 1: Criar o arquivo de actions**

```typescript
// apps/store/src/app/(store)/contratar/actions.ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/service'

// ----------------------------------------------------------------
// Helpers internos
// ----------------------------------------------------------------
async function getTenantId(): Promise<string | null> {
  return (await headers()).get('x-tenant-id')
}

// ----------------------------------------------------------------
// createProposal — cria proposta no primeiro step
// ----------------------------------------------------------------
const createProposalSchema = z.object({
  productId: z.string().uuid(),
  productTypeSlug: z.string().min(1),
  simulationId: z.string().uuid().optional(),
  stepSlug: z.string().min(1),
  stepData: z.record(z.unknown()),
  clientName: z.string().optional(),
  clientPhone: z.string().optional(),
  nextStep: z.string().min(1),
})

export async function createProposal(
  input: z.input<typeof createProposalSchema>,
): Promise<{ error: string } | void> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const parsed = createProposalSchema.safeParse(input)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { productId, productTypeSlug, simulationId, stepSlug, stepData, clientName, clientPhone, nextStep } = parsed.data
  const supabase = createServiceClient()

  // Verificar que o produto pertence ao tenant
  const { data: tp } = await supabase
    .from('tenant_products')
    .select('id, products(id)')
    .eq('id', productId)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  if (!tp) return { error: 'Produto não encontrado.' }

  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert({
      tenant_id: tenantId,
      product_id: (tp.products as { id: string }).id,
      product_type_slug: productTypeSlug,
      simulation_id: simulationId ?? null,
      status: 'nova_proposta',
      current_step: nextStep,
      client_name: clientName ?? null,
      client_phone: clientPhone ?? null,
      form_data: { [stepSlug]: stepData },
    })
    .select('id')
    .single()

  if (error || !proposal) return { error: 'Erro ao criar proposta.' }

  redirect(
    `/contratar/${productTypeSlug.replace(/_/g, '-')}?step=${nextStep}&proposalId=${proposal.id}&productId=${productId}`,
  )
}

// ----------------------------------------------------------------
// saveStep — salva dados de um step e avança para o próximo
// ----------------------------------------------------------------
const saveStepSchema = z.object({
  proposalId: z.string().uuid(),
  stepSlug: z.string().min(1),
  stepData: z.record(z.unknown()),
  nextStep: z.string().min(1),
})

export async function saveStep(
  input: z.input<typeof saveStepSchema>,
): Promise<{ error: string } | void> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const parsed = saveStepSchema.safeParse(input)
  if (!parsed.success) return { error: 'Dados inválidos.' }

  const { proposalId, stepSlug, stepData, nextStep } = parsed.data
  const supabase = createServiceClient()

  const { data: current } = await supabase
    .from('proposals')
    .select('form_data, product_type_slug, status')
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .single()

  if (!current) return { error: 'Proposta não encontrada.' }

  const mergedFormData = {
    ...(current.form_data as Record<string, unknown>),
    [stepSlug]: stepData,
  }

  const { error } = await supabase
    .from('proposals')
    .update({
      form_data: mergedFormData,
      current_step: nextStep,
    })
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'Erro ao salvar.' }

  const urlSlug = current.product_type_slug.replace(/_/g, '-')
  redirect(`/contratar/${urlSlug}?step=${nextStep}&proposalId=${proposalId}`)
}

// ----------------------------------------------------------------
// finalizeEtapa1 — muda status para proposta_criada
// ----------------------------------------------------------------
export async function finalizeEtapa1(proposalId: string): Promise<{ error: string } | void> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('proposals')
    .update({ status: 'proposta_criada', current_step: 'retorno' })
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'Erro ao finalizar.' }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep -E "contratar/actions"
```

Expected: sem output (sem erros).

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/actions.ts
git commit -m "feat(store): Server Actions createProposal e saveStep"
```

---

### Task 5: Server Actions — `uploadDocument` e `finalizeEtapa2`

**Files:**
- Modify: `apps/store/src/app/(store)/contratar/actions.ts`

- [ ] **Step 1: Adicionar as actions de Etapa 2 ao arquivo**

Adicionar ao final de `apps/store/src/app/(store)/contratar/actions.ts`:

```typescript
// ----------------------------------------------------------------
// uploadDocument — faz upload de documento para Supabase Storage
// ----------------------------------------------------------------
export async function uploadDocument(
  proposalId: string,
  documentType: string,
  formData: FormData,
): Promise<{ storagePath: string } | { error: string }> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'Arquivo não encontrado.' }

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg']
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Formato inválido. Use PDF ou JPEG.' }
  }

  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) return { error: 'Arquivo muito grande. Máximo 10MB.' }

  const supabase = createServiceClient()

  // Verificar que a proposta pertence ao tenant
  const { data: proposal } = await supabase
    .from('proposals')
    .select('id')
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)
    .single()

  if (!proposal) return { error: 'Proposta não encontrada.' }

  const ext = file.name.split('.').pop()
  const storagePath = `${tenantId}/${proposalId}/${documentType}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('proposal-documents')
    .upload(storagePath, file, { upsert: true })

  if (uploadError) return { error: 'Erro ao fazer upload.' }

  // Upsert no banco (substitui upload anterior do mesmo tipo)
  await supabase
    .from('proposal_documents')
    .upsert(
      { proposal_id: proposalId, document_type: documentType, storage_path: storagePath, file_name: file.name },
      { onConflict: 'proposal_id,document_type' },
    )

  return { storagePath }
}

// ----------------------------------------------------------------
// finalizeEtapa2 — marca documentos como enviados e redireciona
// ----------------------------------------------------------------
export async function finalizeEtapa2(proposalId: string): Promise<{ error: string } | void> {
  const tenantId = await getTenantId()
  if (!tenantId) return { error: 'Tenant não identificado.' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('proposals')
    .update({ documents_submitted: true, status: 'em_analise' })
    .eq('id', proposalId)
    .eq('tenant_id', tenantId)

  if (error) return { error: 'Erro ao finalizar envio.' }

  redirect(`/proposta/${proposalId}/finalizado`)
}
```

> Nota: o `upsert` em `proposal_documents` exige constraint `UNIQUE(proposal_id, document_type)`. Adicionar à migration do Task 1 ou criar nova migration agora:
>
> ```sql
> ALTER TABLE proposal_documents ADD CONSTRAINT proposal_documents_unique_type
>   UNIQUE (proposal_id, document_type);
> ```
>
> Aplicar: `pnpm supabase db push`

- [ ] **Step 2: Adicionar a constraint `UNIQUE` via migration**

Criar `supabase/migrations/20260517000001_proposal_documents_unique.sql`:

```sql
ALTER TABLE proposal_documents
  ADD CONSTRAINT proposal_documents_unique_type
  UNIQUE (proposal_id, document_type);
```

```bash
pnpm supabase db push
```

- [ ] **Step 3: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep -E "contratar/actions"
```

Expected: sem output.

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/(store)/contratar/actions.ts \
        supabase/migrations/20260517000001_proposal_documents_unique.sql
git commit -m "feat(store): Server Actions uploadDocument e finalizeEtapa2"
```

---

### Task 6: Componente `StepIndicator`

> Use o skill `frontend-design` antes de implementar para alinhar o estilo.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/step-indicator.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/step-indicator.tsx
'use client'

type Props = {
  steps: Array<{ slug: string; label: string }>
  currentStep: string
}

export function StepIndicator({ steps, currentStep }: Props) {
  const currentIndex = steps.findIndex((s) => s.slug === currentStep)

  return (
    <div className="mb-8 w-full">
      {/* Barra de progresso */}
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-surface-foreground/10">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{
            width: `${Math.max(0, ((currentIndex + 1) / steps.length) * 100)}%`,
          }}
        />
      </div>

      {/* Texto: "Passo N de M" */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs font-medium text-surface-foreground/50">
          {currentIndex >= 0 ? (
            <>
              Passo <span className="text-surface-foreground/80">{currentIndex + 1}</span> de{' '}
              <span className="text-surface-foreground/80">{steps.length}</span>
            </>
          ) : null}
        </p>
        {currentIndex >= 0 && (
          <p className="text-xs font-semibold text-surface-foreground/60">
            {steps[currentIndex]?.label}
          </p>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "step-indicator"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): componente StepIndicator"
```

---

### Task 7: Componente `AddressForm` (CEP lookup)

> Use o skill `frontend-design` antes de implementar.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/shared/address-form.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/shared/address-form.tsx
'use client'

import { useState } from 'react'

export type AddressData = {
  cep: string
  rua: string
  numero: string
  complemento: string
  bairro: string
  cidade: string
  estado: string
}

type Props = {
  label: string             // ex: "Endereço do Imóvel"
  value: AddressData
  onChange: (data: AddressData) => void
  showSameAs?: { label: string; data: AddressData }  // checkbox "mesmo endereço de..."
}

const EMPTY: AddressData = { cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }

export function AddressForm({ label, value, onChange, showSameAs }: Props) {
  const [loading, setLoading] = useState(false)
  const [cepError, setCepError] = useState('')

  async function lookupCep(cep: string) {
    const digits = cep.replace(/\D/g, '')
    if (digits.length < 8) return
    setLoading(true)
    setCepError('')
    try {
      const res = await fetch(`/api/cep/${digits}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      onChange({
        ...value,
        cep: digits,
        rua: data.logradouro ?? '',
        bairro: data.bairro ?? '',
        cidade: data.localidade ?? '',
        estado: data.uf ?? '',
      })
    } catch {
      setCepError('CEP não encontrado. Preencha o endereço manualmente.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'w-full rounded-2xl border border-surface-foreground/15 bg-background px-5 py-4 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20'
  const labelCls = 'mb-1.5 block text-sm font-semibold text-surface-foreground'

  return (
    <div className="space-y-4">
      <p className="text-base font-semibold text-surface-foreground">{label}</p>

      {showSameAs && (
        <label className="flex cursor-pointer items-center gap-2.5">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-primary"
            onChange={(e) => {
              if (e.target.checked) onChange({ ...showSameAs.data })
              else onChange(EMPTY)
            }}
          />
          <span className="text-sm text-surface-foreground/70">{showSameAs.label}</span>
        </label>
      )}

      {/* CEP */}
      <div>
        <label className={labelCls}>CEP <span className="text-destructive">*</span></label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="00000-000"
          value={value.cep}
          maxLength={9}
          className={inputCls}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(0, 8)
            onChange({ ...value, cep: v })
            if (v.length === 8) lookupCep(v)
          }}
        />
        {loading && <p className="mt-1 text-xs text-surface-foreground/50">Buscando CEP…</p>}
        {cepError && <p className="mt-1 text-xs text-destructive">{cepError}</p>}
      </div>

      {/* Rua */}
      <div>
        <label className={labelCls}>Rua <span className="text-destructive">*</span></label>
        <input type="text" placeholder="Nome da rua" value={value.rua} className={inputCls}
          onChange={(e) => onChange({ ...value, rua: e.target.value })} />
      </div>

      {/* Número + Complemento */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Número <span className="text-destructive">*</span></label>
          <input type="text" placeholder="123" value={value.numero} className={inputCls}
            onChange={(e) => onChange({ ...value, numero: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Complemento</label>
          <input type="text" placeholder="Apto, bloco…" value={value.complemento} className={inputCls}
            onChange={(e) => onChange({ ...value, complemento: e.target.value })} />
        </div>
      </div>

      {/* Bairro */}
      <div>
        <label className={labelCls}>Bairro <span className="text-destructive">*</span></label>
        <input type="text" placeholder="Bairro" value={value.bairro} className={inputCls}
          onChange={(e) => onChange({ ...value, bairro: e.target.value })} />
      </div>

      {/* Cidade + Estado */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Cidade <span className="text-destructive">*</span></label>
          <input type="text" placeholder="Cidade" value={value.cidade} className={inputCls}
            onChange={(e) => onChange({ ...value, cidade: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Estado <span className="text-destructive">*</span></label>
          <input type="text" placeholder="UF" maxLength={2} value={value.estado} className={inputCls}
            onChange={(e) => onChange({ ...value, estado: e.target.value.toUpperCase() })} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "address-form"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): componente AddressForm com CEP lookup"
```

---

### Task 8: Componente `BankDataForm`

> Use o skill `frontend-design` antes de implementar.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/shared/bank-data-form.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/shared/bank-data-form.tsx
'use client'

import { ChevronDown } from 'lucide-react'

const BANKS = [
  'Banco do Brasil', 'Bradesco', 'Caixa Econômica Federal', 'Itaú',
  'Santander', 'Nubank', 'Sicredi', 'Sicoob', 'Inter', 'C6 Bank',
  'BTG Pactual', 'XP', 'Banrisul', 'BRB', 'Mercado Pago', 'PicPay',
]

export type BankData = {
  banco: string
  agencia: string
  conta: string
  pix: string
  confirmaTitularidade: boolean
}

type Props = {
  value: BankData
  onChange: (data: BankData) => void
  titularLabel?: string  // ex: "proprietário do imóvel" | "titular do crédito"
  error?: string
}

export function BankDataForm({ value, onChange, titularLabel = 'titular do crédito', error }: Props) {
  const inputCls = 'w-full rounded-2xl border border-surface-foreground/15 bg-background px-5 py-4 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20'
  const labelCls = 'mb-1.5 block text-sm font-semibold text-surface-foreground'

  return (
    <div className="space-y-4">
      {/* Banco */}
      <div>
        <label className={labelCls}>Banco <span className="text-destructive">*</span></label>
        <div className="relative">
          <select
            value={value.banco}
            onChange={(e) => onChange({ ...value, banco: e.target.value })}
            className={`${inputCls} appearance-none`}
          >
            <option value="" disabled>Selecione seu banco…</option>
            {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {/* Agência + Conta */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Agência <span className="text-destructive">*</span></label>
          <input type="text" inputMode="numeric" placeholder="0000" value={value.agencia}
            className={inputCls}
            onChange={(e) => onChange({ ...value, agencia: e.target.value.replace(/\D/g, '') })} />
        </div>
        <div>
          <label className={labelCls}>Conta-corrente <span className="text-destructive">*</span></label>
          <input type="text" inputMode="numeric" placeholder="00000-0" value={value.conta}
            className={inputCls}
            onChange={(e) => onChange({ ...value, conta: e.target.value.replace(/\D/g, '') })} />
        </div>
      </div>

      {/* PIX */}
      <div>
        <label className={labelCls}>Chave PIX <span className="text-surface-foreground/40 font-normal text-xs">(opcional)</span></label>
        <input type="text" placeholder="CPF, e-mail, telefone ou chave aleatória" value={value.pix}
          className={inputCls}
          onChange={(e) => onChange({ ...value, pix: e.target.value })} />
      </div>

      {/* Confirmação de titularidade */}
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-surface-foreground/12 bg-surface-foreground/3 p-4">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 flex-shrink-0 rounded accent-primary"
          checked={value.confirmaTitularidade}
          onChange={(e) => onChange({ ...value, confirmaTitularidade: e.target.checked })}
        />
        <span className="text-sm text-surface-foreground/80">
          Confirmo que esta conta bancária está no nome do {titularLabel}.
        </span>
      </label>

      {error && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "bank-data-form"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): componente BankDataForm"
```

---

### Task 9: Componente `DocumentUploadChecklist`

> Use o skill `frontend-design` antes de implementar.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/shared/document-upload-checklist.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/shared/document-upload-checklist.tsx
'use client'

import { useState, useTransition } from 'react'
import { CheckCircle2, Upload, X, FileText, Image } from 'lucide-react'
import { uploadDocument } from '../../actions'

export type DocumentItem = {
  type: string          // ex: 'rg_cpf_frente'
  label: string         // ex: 'RG e CPF (frente e verso)'
  hint?: string         // ex: 'Arquivos dos últimos 3 meses'
  accept?: 'pdf' | 'jpeg' | 'both'  // default: both
}

type UploadState = 'idle' | 'uploading' | 'done' | 'error'

type Props = {
  proposalId: string
  documents: DocumentItem[]
  onAllUploaded: () => void
}

export function DocumentUploadChecklist({ proposalId, documents, onAllUploaded }: Props) {
  const [states, setStates] = useState<Record<string, UploadState>>(
    Object.fromEntries(documents.map((d) => [d.type, 'idle'])),
  )
  const [fileNames, setFileNames] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const allDone = documents.every((d) => states[d.type] === 'done')

  function acceptAttr(item: DocumentItem): string {
    if (item.accept === 'pdf') return '.pdf'
    if (item.accept === 'jpeg') return '.jpg,.jpeg'
    return '.pdf,.jpg,.jpeg'
  }

  function handleFileChange(item: DocumentItem, file: File | null) {
    if (!file) return
    setStates((prev) => ({ ...prev, [item.type]: 'uploading' }))
    setErrors((prev) => ({ ...prev, [item.type]: '' }))

    const fd = new FormData()
    fd.set('file', file)

    startTransition(async () => {
      const result = await uploadDocument(proposalId, item.type, fd)
      if ('error' in result) {
        setStates((prev) => ({ ...prev, [item.type]: 'error' }))
        setErrors((prev) => ({ ...prev, [item.type]: result.error }))
      } else {
        setStates((prev) => ({ ...prev, [item.type]: 'done' }))
        setFileNames((prev) => ({ ...prev, [item.type]: file.name }))
      }
    })
  }

  return (
    <div className="space-y-3">
      {documents.map((item) => {
        const state = states[item.type]
        const isDone = state === 'done'
        const isError = state === 'error'
        const isUploading = state === 'uploading'

        return (
          <div
            key={item.type}
            className={`rounded-2xl border p-4 transition-colors ${
              isDone
                ? 'border-green-500/30 bg-green-50/50'
                : isError
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-surface-foreground/12 bg-background'
            }`}
          >
            <div className="flex items-start gap-3">
              {/* Ícone de status */}
              <div className="mt-0.5 flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <div className={`h-5 w-5 rounded-full border-2 ${isError ? 'border-destructive' : 'border-surface-foreground/25'}`} />
                )}
              </div>

              {/* Conteúdo */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-surface-foreground">{item.label}</p>
                {item.hint && (
                  <p className="mt-0.5 text-xs text-surface-foreground/50">{item.hint}</p>
                )}
                {isDone && fileNames[item.type] && (
                  <p className="mt-1 truncate text-xs text-green-600">{fileNames[item.type]}</p>
                )}
                {isError && errors[item.type] && (
                  <p className="mt-1 text-xs text-destructive">{errors[item.type]}</p>
                )}
              </div>

              {/* Botão upload */}
              <label className={`flex-shrink-0 cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                isUploading
                  ? 'bg-surface-foreground/10 text-surface-foreground/40'
                  : isDone
                  ? 'bg-surface-foreground/8 text-surface-foreground/60 hover:bg-surface-foreground/12'
                  : 'bg-primary/10 text-primary hover:bg-primary/15'
              }`}>
                <input
                  type="file"
                  className="sr-only"
                  accept={acceptAttr(item)}
                  disabled={isUploading}
                  onChange={(e) => handleFileChange(item, e.target.files?.[0] ?? null)}
                />
                {isUploading ? '…' : isDone ? 'Trocar' : 'Enviar'}
              </label>
            </div>
          </div>
        )
      })}

      {/* Botão Finalizar */}
      <button
        type="button"
        disabled={!allDone || isPending}
        onClick={onAllUploaded}
        className="mt-4 w-full rounded-2xl bg-primary py-4 text-sm font-semibold text-primary-foreground transition-opacity disabled:opacity-40"
      >
        {isPending ? 'Finalizando…' : 'Finalizar Envio'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "document-upload"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): componente DocumentUploadChecklist"
```

---

### Task 10: Componente `SocioFields` (campos dinâmicos de sócios)

> Use o skill `frontend-design` antes de implementar.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/shared/socio-fields.tsx`

- [ ] **Step 1: Criar o componente**

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/shared/socio-fields.tsx
'use client'

import { ChevronDown } from 'lucide-react'

export type SocioData = {
  nome: string
  cpf: string
  rg?: string
  dataNascimento: string
  email: string
  whatsapp: string
  estadoCivil?: 'solteiro' | 'casado' | 'outros'
  conjuge?: {
    nome: string
    cpf: string
    dataNascimento: string
    email: string
    whatsapp: string
  }
}

type Props = {
  value: SocioData[]
  onChange: (socios: SocioData[]) => void
  withRg?: boolean           // Antecipação de Recebíveis pede RG
  withEstadoCivil?: boolean  // CGI PJ, Auto Equity PJ, etc.
  label?: string             // default: "Dados dos Sócios"
}

const EMPTY_SOCIO: SocioData = {
  nome: '', cpf: '', rg: '', dataNascimento: '', email: '', whatsapp: '',
  estadoCivil: 'solteiro',
}

const inputCls = 'w-full rounded-2xl border border-surface-foreground/15 bg-background px-5 py-4 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20'
const labelCls = 'mb-1.5 block text-sm font-semibold text-surface-foreground'

function isOver70(dateStr: string): boolean {
  if (!dateStr) return false
  const birth = new Date(dateStr)
  const age = (Date.now() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  return age >= 70
}

export function SocioFields({ value, onChange, withRg = false, withEstadoCivil = true, label = 'Dados dos Sócios' }: Props) {
  function updateSocio(index: number, patch: Partial<SocioData>) {
    const updated = value.map((s, i) => (i === index ? { ...s, ...patch } : s))
    onChange(updated)
  }

  function setCount(n: number) {
    const arr = Array.from({ length: n }, (_, i) => value[i] ?? { ...EMPTY_SOCIO })
    onChange(arr)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className={labelCls}>Quantidade de sócios <span className="text-destructive">*</span></label>
        <div className="relative">
          <select
            value={value.length || ''}
            onChange={(e) => setCount(Number(e.target.value))}
            className={`${inputCls} appearance-none`}
          >
            <option value="" disabled>Selecione…</option>
            {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} sócio{n > 1 ? 's' : ''}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
        </div>
      </div>

      {value.map((socio, i) => (
        <div key={i} className="space-y-4 rounded-2xl border border-surface-foreground/12 p-4">
          <p className="text-sm font-bold text-surface-foreground">
            {value.length > 1 ? `${i + 1}º Sócio` : label}
          </p>

          <div>
            <label className={labelCls}>Nome completo <span className="text-destructive">*</span></label>
            <input type="text" placeholder="Nome completo" value={socio.nome} className={inputCls}
              onChange={(e) => updateSocio(i, { nome: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>CPF <span className="text-destructive">*</span></label>
              <input type="text" inputMode="numeric" placeholder="000.000.000-00" value={socio.cpf} className={inputCls}
                onChange={(e) => updateSocio(i, { cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })} />
            </div>
            {withRg && (
              <div>
                <label className={labelCls}>RG <span className="text-destructive">*</span></label>
                <input type="text" placeholder="RG" value={socio.rg ?? ''} className={inputCls}
                  onChange={(e) => updateSocio(i, { rg: e.target.value })} />
              </div>
            )}
          </div>

          <div>
            <label className={labelCls}>Data de nascimento <span className="text-destructive">*</span></label>
            <input type="date" value={socio.dataNascimento} className={inputCls}
              onChange={(e) => updateSocio(i, { dataNascimento: e.target.value })} />
            {isOver70(socio.dataNascimento) && (
              <p className="mt-1.5 text-xs text-destructive">
                Esta operação não está disponível para pessoas com 70 anos ou mais.
              </p>
            )}
          </div>

          <div>
            <label className={labelCls}>E-mail <span className="text-destructive">*</span></label>
            <input type="email" placeholder="email@empresa.com" value={socio.email} className={inputCls}
              onChange={(e) => updateSocio(i, { email: e.target.value })} />
          </div>

          <div>
            <label className={labelCls}>WhatsApp <span className="text-destructive">*</span></label>
            <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-background focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
              <span className="select-none pl-5 pr-3 text-sm font-medium text-surface-foreground/40">+55</span>
              <div className="h-5 w-px bg-surface-foreground/12" />
              <input type="tel" placeholder="(11) 99999-9999" value={socio.whatsapp}
                className="flex-1 bg-transparent py-4 pl-3 pr-5 text-sm text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
                onChange={(e) => updateSocio(i, { whatsapp: e.target.value.replace(/\D/g, '') })} />
            </div>
          </div>

          {withEstadoCivil && (
            <>
              <div>
                <label className={labelCls}>Estado civil <span className="text-destructive">*</span></label>
                <div className="relative">
                  <select
                    value={socio.estadoCivil ?? 'solteiro'}
                    onChange={(e) => updateSocio(i, { estadoCivil: e.target.value as SocioData['estadoCivil'] })}
                    className={`${inputCls} appearance-none`}
                  >
                    <option value="solteiro">Solteiro(a)</option>
                    <option value="casado">Casado(a)</option>
                    <option value="outros">Outros</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-foreground/40" />
                </div>
              </div>

              {socio.estadoCivil === 'casado' && (
                <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/3 p-4">
                  <p className="text-sm font-semibold text-surface-foreground/70">Dados do cônjuge</p>
                  {(['nome', 'cpf', 'dataNascimento', 'email', 'whatsapp'] as const).map((field) => (
                    <div key={field}>
                      <label className={labelCls}>
                        {field === 'nome' ? 'Nome completo' : field === 'cpf' ? 'CPF' : field === 'dataNascimento' ? 'Data de nascimento' : field === 'email' ? 'E-mail' : 'WhatsApp'}
                        {' '}<span className="text-destructive">*</span>
                      </label>
                      <input
                        type={field === 'dataNascimento' ? 'date' : field === 'email' ? 'email' : 'text'}
                        value={socio.conjuge?.[field] ?? ''}
                        className={inputCls}
                        onChange={(e) =>
                          updateSocio(i, { conjuge: { ...socio.conjuge, nome: '', cpf: '', dataNascimento: '', email: '', whatsapp: '', [field]: e.target.value } })
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verificar compilação**

```bash
pnpm --filter @vello/store exec tsc --noEmit 2>&1 | grep "socio-fields"
```

Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): componente SocioFields dinâmico"
```

---

### Task 11: Componente `WizardContainer` e rota base

> Use o skill `frontend-design` antes de implementar.

**Files:**
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizard-container.tsx`
- Create: `apps/store/src/app/(store)/contratar/[productTypeSlug]/page.tsx`

- [ ] **Step 1: Criar tipos e constantes do wizard**

Criar `apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/flow-config.ts`:

```typescript
// flow-config.ts — step order por product_type_slug
export type StepConfig = {
  slug: string
  label: string
}

export const PRODUCT_FLOWS: Record<string, { etapa1: StepConfig[]; etapa2: StepConfig[] }> = {
  home_equity: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-pessoais', label: 'Dados Pessoais' },
      { slug: 'endereco-garantia', label: 'End. Garantia' },
      { slug: 'endereco-residencial', label: 'End. Residencial' },
      { slug: 'renda-ocupacao', label: 'Renda' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-pessoais', label: 'Docs. Pessoais' },
      { slug: 'documentos-imovel', label: 'Docs. Imóvel' },
    ],
  },
  home_equity_pj: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-empresa', label: 'Empresa' },
      { slug: 'atividade-faturamento', label: 'Atividade' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'endereco-garantia', label: 'End. Garantia' },
      { slug: 'endereco-empresa', label: 'End. Empresa' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-pessoais-socios', label: 'Docs. Sócios' },
      { slug: 'documentos-imovel', label: 'Docs. Imóvel' },
    ],
  },
  auto_equity: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-pessoais', label: 'Dados Pessoais' },
      { slug: 'renda-ocupacao', label: 'Renda' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-pessoais', label: 'Docs. Pessoais' },
      { slug: 'documentos-veiculo', label: 'Docs. Veículo' },
    ],
  },
  auto_equity_pj: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-empresa', label: 'Empresa' },
      { slug: 'atividade-faturamento', label: 'Atividade' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-pessoais-socios', label: 'Docs. Sócios' },
      { slug: 'documentos-veiculo', label: 'Docs. Veículo' },
    ],
  },
  fgts: {
    etapa1: [
      { slug: 'liberacao-saque', label: 'Saque Aniversário' },
      { slug: 'liberacao-bancos', label: 'Autorização Bancos' },
      { slug: 'verificar-margem', label: 'Seus Dados' },
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [],
  },
  capital_giro: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-empresa', label: 'Empresa' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'garantia', label: 'Garantia' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-pessoais-socios', label: 'Docs. Sócios' },
      { slug: 'documentos-garantia', label: 'Docs. Garantia' },
    ],
  },
  antecipacao_recebiveis: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-empresa', label: 'Empresa' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-pessoais-socios', label: 'Docs. Sócios' },
      { slug: 'documentos-garantia', label: 'Docs. Recebíveis' },
    ],
  },
  financiamento_imovel: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-solicitante', label: 'Empresa' },
      { slug: 'atividade-faturamento', label: 'Atividade' },
      { slug: 'dados-socios', label: 'Sócios' },
      { slug: 'dados-vendedor', label: 'Vendedor' },
      { slug: 'endereco-imovel', label: 'End. Imóvel' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios-vendedor', label: 'Dados Bancários' },
      { slug: 'documentos-empresa', label: 'Docs. Empresa' },
      { slug: 'documentos-imovel', label: 'Docs. Imóvel' },
    ],
  },
  financiamento_veiculo: {
    etapa1: [
      { slug: 'operacao', label: 'Operação' },
      { slug: 'dados-pessoais', label: 'Dados Pessoais' },
      { slug: 'renda-ocupacao', label: 'Renda' },
      { slug: 'dados-vendedor', label: 'Vendedor' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'documentos-pessoais', label: 'Docs. Pessoais' },
      { slug: 'documentos-veiculo', label: 'Docs. Veículo' },
    ],
  },
  consignado_privado: {
    etapa1: [
      { slug: 'pre-filtro', label: 'Qualificação' },
      { slug: 'autorizacao-dataprev', label: 'Autorização' },
      { slug: 'dados-pessoais', label: 'Dados Pessoais' },
      { slug: 'dados-profissionais', label: 'Emprego' },
      { slug: 'dados-bancarios', label: 'Dados Bancários' },
      { slug: 'retorno', label: 'Confirmação' },
    ],
    etapa2: [],
  },
}

// URL slug (kebab) → DB slug (snake)
export const URL_TO_DB_SLUG: Record<string, string> = {
  'home-equity': 'home_equity',
  'home-equity-pj': 'home_equity_pj',
  'auto-equity': 'auto_equity',
  'auto-equity-pj': 'auto_equity_pj',
  'fgts': 'fgts',
  'capital-de-giro': 'capital_giro',
  'antecipacao-recebiveis': 'antecipacao_recebiveis',
  'financiamento-imovel': 'financiamento_imovel',
  'financiamento-veiculo': 'financiamento_veiculo',
  'consignado-clt': 'consignado_privado',
}
```

- [ ] **Step 2: Criar `page.tsx`**

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/page.tsx
import { headers } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { getTenantProduct, getProposal } from '../../queries'
import { URL_TO_DB_SLUG } from './_components/flow-config'
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

  // Se não tiver produto e não tiver proposta existente, redireciona para o simulador
  if (!product && !proposal) redirect('/simulador')

  const currentStep = step ?? 'operacao'

  return (
    <WizardContainer
      productTypeSlug={dbSlug}
      currentStep={currentStep}
      proposal={proposal ?? null}
      product={product ?? null}
      productId={productId ?? null}
      simulationId={simulationId ?? null}
    />
  )
}
```

- [ ] **Step 3: Criar `wizard-container.tsx` (stub — expandido por produto nos próximos tasks)**

```tsx
// apps/store/src/app/(store)/contratar/[productTypeSlug]/_components/wizard-container.tsx
'use client'

import { PRODUCT_FLOWS } from './flow-config'
import { StepIndicator } from './step-indicator'
import type { ProposalWithProduct } from '../../../queries'

// Placeholder — steps reais são adicionados no plano de produtos
function UnimplementedStep({ stepSlug }: { stepSlug: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-foreground/20 p-8 text-center text-sm text-surface-foreground/40">
      Step <code>{stepSlug}</code> — a ser implementado
    </div>
  )
}

type Props = {
  productTypeSlug: string
  currentStep: string
  proposal: ProposalWithProduct | null
  product: Awaited<ReturnType<typeof import('../../../queries').getTenantProduct>> | null
  productId: string | null
  simulationId: string | null
}

export function WizardContainer({ productTypeSlug, currentStep, proposal, product, productId, simulationId }: Props) {
  const flow = PRODUCT_FLOWS[productTypeSlug]
  if (!flow) return <p className="p-8 text-center text-sm text-surface-foreground/40">Produto não configurado.</p>

  const etapa1Steps = flow.etapa1
  const isRetorno = currentStep === 'retorno'

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      {!isRetorno && (
        <StepIndicator
          steps={etapa1Steps.filter((s) => s.slug !== 'retorno')}
          currentStep={currentStep}
        />
      )}

      <div className="mt-2">
        <UnimplementedStep stepSlug={currentStep} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Build check**

```bash
pnpm --filter @vello/store build 2>&1 | tail -20
```

Expected: build passa. A página `/contratar/home-equity` exibe "Step operacao — a ser implementado".

- [ ] **Step 5: Commit**

```bash
git add apps/store/src/app/(store)/contratar/
git commit -m "feat(store): routing base /contratar/[productTypeSlug] + wizard infrastructure"
```

---

### Task 12: Rotas `/proposta/[proposalId]/documentos` e `/proposta/[proposalId]/finalizado`

**Files:**
- Create: `apps/store/src/app/(store)/proposta/[proposalId]/documentos/page.tsx`
- Create: `apps/store/src/app/(store)/proposta/[proposalId]/finalizado/page.tsx`

- [ ] **Step 1: Criar página de documentos (Etapa 2 — stub)**

```tsx
// apps/store/src/app/(store)/proposta/[proposalId]/documentos/page.tsx
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getProposal } from '../../../queries'

type Props = {
  params: Promise<{ proposalId: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function DocumentosPage({ params, searchParams }: Props) {
  const { proposalId } = await params
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) notFound()

  const proposal = await getProposal(proposalId, tenantId)
  if (!proposal) notFound()

  // Stub — conteúdo real adicionado no plano de produtos
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-8">
      <p className="text-sm text-surface-foreground/50">
        Etapa 2 — {proposal.product_type_slug} — a ser implementado
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Criar página de finalização**

```tsx
// apps/store/src/app/(store)/proposta/[proposalId]/finalizado/page.tsx
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getProposal } from '../../../queries'
import { CheckCircle2 } from 'lucide-react'

type Props = { params: Promise<{ proposalId: string }> }

export default async function FinalizadoPage({ params }: Props) {
  const { proposalId } = await params
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) notFound()

  const proposal = await getProposal(proposalId, tenantId)
  if (!proposal) notFound()

  const isFgts = proposal.product_type_slug === 'fgts'

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-4 py-16 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
        <CheckCircle2 className="h-10 w-10 text-green-500" />
      </div>

      <h1 className="mb-3 text-2xl font-bold text-surface-foreground">
        {isFgts ? 'Dados recebidos!' : 'Documentos enviados!'}
      </h1>

      <p className="text-base leading-relaxed text-surface-foreground/70">
        {isFgts
          ? 'Em breve, você receberá o link para seguir com a contratação do crédito. Fique atento ao seu e-mail e WhatsApp, entraremos em contato com os próximos passos!'
          : 'Agora, nossa equipe jurídica e os analistas de crédito darão continuidade à análise para avançarmos para a etapa de contrato. Fique de olho no seu e-mail e WhatsApp, em breve entraremos em contato com os próximos passos. Se tiver qualquer dúvida, nossa equipe está pronta para te atender!'}
      </p>

      <div className="mt-8 rounded-2xl border border-surface-foreground/10 bg-surface-foreground/3 px-6 py-4 text-left w-full">
        <p className="text-xs font-semibold uppercase tracking-wider text-surface-foreground/40 mb-2">
          Número da proposta
        </p>
        <p className="font-mono text-sm text-surface-foreground/70">{proposalId}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Build check**

```bash
pnpm --filter @vello/store build 2>&1 | tail -10
```

Expected: build passa.

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/(store)/proposta/
git commit -m "feat(store): rotas /proposta/[id]/documentos e /proposta/[id]/finalizado"
```

---

> **Foundation concluída.** As rotas base existem, as Server Actions funcionam e todos os componentes compartilhados estão disponíveis. O próximo passo é o plano `2026-05-17-contratar-produtos.md` que popula o `WizardContainer` com os steps reais de cada produto.

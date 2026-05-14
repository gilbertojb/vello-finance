# Refinamentos de Simulações — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enriquecer a listagem de simulações no console com novos campos pessoais e sheet de detalhes; coletar email no formulário da store e dados de qualificação em passo dedicado.

**Architecture:** Migration adiciona 5 colunas nullable a `simulations`; store coleta email no form principal e CPF/nascimento/cidade/renda na nova página `/simulator/qualification/[id]`; console exibe nova tabela + sheet lateral. Toda lógica de banco fica em Server Actions — sem chamadas Supabase no cliente.

**Tech Stack:** Next.js 15 App Router, Supabase, TypeScript, Tailwind CSS, shadcn/ui (Sheet, Badge, Card, Button), Lucide icons, vitest

---

## Mapa de arquivos

```
supabase/migrations/
└── 20260514130000_add_personal_fields_to_simulations.sql   ← criar

apps/store/src/app/(store)/simulator/
├── actions.ts                              ← modificar (saveSimulation + novo updateAndQualifySimulation)
├── qualificacao/[id]/
│   └── page.tsx                           ← criar (Server Component → QualificacaoForm)
├── _components/
│   └── qualificacao-form.tsx              ← criar (Client Component com formulário)
├── pessoa-fisica/auto-equity/_components/auto-equity-form.tsx      ← adicionar email
├── pessoa-fisica/energy-bill/_components/energy-bill-form.tsx          ← adicionar email
├── pessoa-fisica/personal-loan/_components/personal-loan-form.tsx ← adicionar email
├── pessoa-fisica/fgts/_components/fgts-form.tsx                    ← adicionar email
├── pessoa-fisica/home-equity/_components/home-equity-form.tsx      ← adicionar email
├── pessoa-juridica/receivables-advance/_components/receivables-advance-form.tsx ← adicionar email
├── pessoa-juridica/working-capital/_components/working-capital-form.tsx  ← adicionar email
├── financiamentos/property/_components/financiamento-imovel-form.tsx ← adicionar email
├── financiamentos/vehicle/_components/financiamento-veiculo-form.tsx ← adicionar email
├── pessoa-fisica/auto-equity/result/_components/auto-equity-resultado.tsx      ← email + botão
├── pessoa-fisica/energy-bill/result/_components/energy-bill-resultado.tsx          ← email + botão
├── pessoa-fisica/personal-loan/result/_components/personal-loan-resultado.tsx ← email + botão
├── pessoa-fisica/fgts/result/_components/fgts-resultado.tsx                    ← email + botão
├── pessoa-fisica/home-equity/result/_components/home-equity-resultado.tsx      ← email + botão
├── pessoa-juridica/receivables-advance/result/_components/receivables-advance-resultado.tsx ← email + botão
├── pessoa-juridica/working-capital/result/_components/working-capital-resultado.tsx  ← email + botão
├── financiamentos/property/result/_components/financiamento-imovel-resultado.tsx ← email + botão
└── financiamentos/vehicle/result/_components/financiamento-veiculo-resultado.tsx ← email + botão

apps/console/src/app/(private)/simulations/
├── queries.ts                                    ← adicionar 5 campos ao SELECT
└── _components/
    ├── simulations-list.tsx                      ← reescrever (nova tabela + tabs + sheet)
    └── simulation-detail-sheet.tsx               ← criar (sheet de detalhes)
```

---

## Task 1: Migration — adicionar campos pessoais em simulations

**Files:**
- Create: `supabase/migrations/20260514130000_add_personal_fields_to_simulations.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260514130000_add_personal_fields_to_simulations.sql
ALTER TABLE simulations
  ADD COLUMN client_email     TEXT,
  ADD COLUMN client_cpf       TEXT,
  ADD COLUMN client_birthdate DATE,
  ADD COLUMN client_city      TEXT,
  ADD COLUMN client_income    NUMERIC(12,2);
```

- [ ] **Step 2: Aplicar a migration**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
npx supabase db push
```

Expected: `Applying migration 20260514130000_add_personal_fields_to_simulations.sql... done`

- [ ] **Step 3: Verificar colunas no banco**

```bash
npx supabase db diff --schema public 2>/dev/null | grep -A5 "client_email"
```

Expected: linhas mostrando `client_email text` nas colunas de `simulations`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260514130000_add_personal_fields_to_simulations.sql
git commit -m "feat(db): adiciona campos pessoais em simulations"
```

---

## Task 2: Regenerar types do banco

**Files:**
- Modify: `packages/database/src/types.ts` (gerado automaticamente)

- [ ] **Step 1: Regenerar**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm db:types
```

Expected: `packages/database/src/types.ts` updated — `simulations.Row` agora tem `client_email: string | null`, `client_cpf: string | null`, `client_birthdate: string | null`, `client_city: string | null`, `client_income: number | null`.

- [ ] **Step 2: Confirmar geração**

```bash
grep "client_email\|client_cpf\|client_birthdate\|client_city\|client_income" packages/database/src/types.ts
```

Expected: 5 linhas, uma por campo, todas com `string | null` ou `number | null`.

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/types.ts
git commit -m "chore: regenera types após migration de campos pessoais"
```

---

## Task 3: Atualizar store/actions.ts

**Files:**
- Modify: `apps/store/src/app/(store)/simulator/actions.ts`

Context: O arquivo atual tem `saveSimulation` e `qualifySimulation`. Vamos:
1. Adicionar `clientEmail` opcional ao `saveSimulation`
2. Adicionar a nova action `updateAndQualifySimulation` (usada na página de qualificação)

- [ ] **Step 1: Escrever o arquivo atualizado completo**

```typescript
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import type { Json } from '@vello/database'

export async function saveSimulation(input: {
  tenantProductId: string
  clientName: string
  clientPhone: string
  clientEmail?: string
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
      client_email: input.clientEmail ?? null,
      desired_amount: input.desiredAmount,
      desired_term_months: input.desiredTermMonths,
      estimated_rate: input.estimatedRate,
      estimated_payment: input.estimatedPayment,
      simulation_data: input.simulationData as Json,
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

  redirect(`/thank-you/${simulationId}`)
}

export async function updateAndQualifySimulation(
  simulationId: string,
  data: {
    cpf: string
    birthdate: string
    city: string
    income: number
  },
): Promise<void> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return

  const supabase = createServiceClient()
  await supabase
    .from('simulations')
    .update({
      client_cpf: data.cpf.replace(/\D/g, ''),
      client_birthdate: data.birthdate,
      client_city: data.city.trim(),
      client_income: data.income,
      status: 'pre_qualificado',
    })
    .eq('id', simulationId)
    .eq('tenant_id', tenantId)

  redirect(`/thank-you/${simulationId}`)
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | grep -v node_modules | head -20
```

Expected: sem erros relacionados a `actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/\(store\)/simulator/actions.ts
git commit -m "feat(store): adiciona clientEmail ao saveSimulation e action updateAndQualifySimulation"
```

---

## Task 4: Adicionar campo email nos 9 formulários da store

**Files (modificar todos os 9):**
- `apps/store/src/app/(store)/simulator/individual/home-equity/_components/home-equity-form.tsx`
- `apps/store/src/app/(store)/simulator/individual/fgts/_components/fgts-form.tsx`
- `apps/store/src/app/(store)/simulator/individual/auto-equity/_components/auto-equity-form.tsx`
- `apps/store/src/app/(store)/simulator/individual/energy-bill/_components/energy-bill-form.tsx`
- `apps/store/src/app/(store)/simulator/individual/personal-loan/_components/personal-loan-form.tsx`
- `apps/store/src/app/(store)/simulator/business/receivables-advance/_components/receivables-advance-form.tsx`
- `apps/store/src/app/(store)/simulator/business/working-capital/_components/working-capital-form.tsx`
- `apps/store/src/app/(store)/simulator/financing/property/_components/financiamento-imovel-form.tsx`
- `apps/store/src/app/(store)/simulator/financing/vehicle/_components/financiamento-veiculo-form.tsx`

Cada formulário recebe **exatamente as mesmas 4 adições** — leia cada arquivo antes de editar.

### Adição 1 — estado (após `const [whatsapp, setWhatsapp] = useState('')`)

```typescript
const [email, setEmail] = useState('')
```

### Adição 2 — validação (na expressão `canSubmit`, adicionar condição)

```typescript
// Adicionar ao final da expressão canSubmit:
&& /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
```

### Adição 3 — campo input (após o bloco JSX do campo WhatsApp)

```tsx
{/* E-mail */}
<div>
  <label
    htmlFor="email"
    className="mb-1.5 block text-sm font-semibold text-surface-foreground"
  >
    E-mail <span className="text-red-400">*</span>
  </label>
  <input
    type="email"
    id="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    placeholder="seu@email.com"
    className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
  />
</div>
```

### Adição 4 — payload sessionStorage (dentro de `handleSubmit`, adicionar ao objeto `payload`)

```typescript
email: email.trim(),
```

- [ ] **Step 1: Aplicar as 4 adições em cada um dos 9 arquivos**

Leia cada arquivo, localize os pontos de inserção, aplique.

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | grep -v node_modules | head -20
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/\(store\)/simulator/individual/ \
        apps/store/src/app/\(store\)/simulator/business/ \
        apps/store/src/app/\(store\)/simulator/financing/
git commit -m "feat(store): adiciona campo email em todos os formulários do simulador"
```

---

## Task 5: Atualizar 9 componentes resultado (email + botão qualificação)

**Files (os mesmos 9 de resultado, listados no mapa acima):**

Cada resultado recebe **exatamente 2 mudanças** — leia cada arquivo antes de editar.

### Mudança 1 — passar email para saveSimulation

Localize o bloco que chama `saveSimulation({...})` dentro do `useEffect`. Adicione a linha:

```typescript
clientEmail: parsed.email ?? '',
```

no objeto passado para `saveSimulation`, logo após `clientPhone`.

### Mudança 2 — trocar botão "Quero contratar"

Localize o button com `onClick={async () => { ... await qualifySimulation(simulationId) }}`.

Substitua o `onClick` completo por:

```typescript
onClick={() => {
  if (!simulationId) return
  router.push(`/simulator/qualification/${simulationId}`)
}}
```

Remova também o estado `isQualifying` e sua setter `setIsQualifying` se existirem, pois não são mais necessários. Atualize o texto do botão para:

```tsx
{simulationId ? 'Quero contratar este crédito →' : 'Carregando...'}
```

Remova o import de `qualifySimulation` das actions no topo do arquivo se não houver outro uso.

- [ ] **Step 1: Aplicar as 2 mudanças em cada um dos 9 arquivos resultado**

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | grep -v node_modules | head -20
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/store/src/app/\(store\)/simulator/
git commit -m "feat(store): passa email para saveSimulation e redireciona para qualificacao"
```

---

## Task 6: Criar página de qualificação

**Files:**
- Create: `apps/store/src/app/(store)/simulator/qualification/[id]/page.tsx`
- Create: `apps/store/src/app/(store)/simulator/_components/qualification-form.tsx`

Context: Ao clicar em "Quero contratar", o usuário é redirecionado para esta página. Ela coleta CPF, data de nascimento, cidade e renda mensal, depois chama `updateAndQualifySimulation` e redireciona para `/thank-you/[id]`.

### Padrão de input do projeto store

Os inputs na store usam estas classes Tailwind (retirado de formulários existentes):

```
rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] 
text-surface-foreground placeholder:text-surface-foreground/35
focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20
```

- [ ] **Step 1: Criar `qualificacao-form.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { updateAndQualifySimulation } from '../actions'

function parseBRL(raw: string): number {
  return Math.max(0, Number(raw.replace(/\D/g, '')) || 0)
}

function maskCPF(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

type Props = { simulationId: string }

export function QualificacaoForm({ simulationId }: Props) {
  const [cpf, setCpf] = useState('')
  const [birthdate, setBirthdate] = useState('')
  const [city, setCity] = useState('')
  const [rawIncome, setRawIncome] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const income = parseBRL(rawIncome)
  const cpfDigits = cpf.replace(/\D/g, '')

  const canSubmit =
    cpfDigits.length === 11 &&
    birthdate.length === 10 &&
    city.trim().length >= 2 &&
    income > 0

  async function handleSubmit() {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    await updateAndQualifySimulation(simulationId, {
      cpf: cpfDigits,
      birthdate,
      city,
      income,
    })
  }

  return (
    <div className="space-y-5">
      <div className="mb-4">
        <p className="text-[15px] font-semibold text-surface-foreground">
          Quase lá! Só precisamos de mais alguns dados.
        </p>
        <p className="mt-1 text-sm text-surface-foreground/55">
          Essas informações são necessárias para análise do seu crédito.
        </p>
      </div>

      {/* CPF */}
      <div>
        <label
          htmlFor="cpf"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          CPF <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="cpf"
          inputMode="numeric"
          value={cpf}
          onChange={(e) => setCpf(maskCPF(e.target.value))}
          placeholder="000.000.000-00"
          className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Data de nascimento */}
      <div>
        <label
          htmlFor="birthdate"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Data de nascimento <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          id="birthdate"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Cidade */}
      <div>
        <label
          htmlFor="city"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Cidade <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ex: São Paulo"
          className="w-full rounded-2xl border border-surface-foreground/15 bg-white px-5 py-4 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Renda mensal */}
      <div>
        <label
          htmlFor="income"
          className="mb-1.5 block text-sm font-semibold text-surface-foreground"
        >
          Renda mensal <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center rounded-2xl border border-surface-foreground/15 bg-white focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-5 pr-2 text-[15px] font-medium text-surface-foreground/50">
            R$
          </span>
          <input
            type="text"
            id="income"
            inputMode="numeric"
            value={rawIncome}
            onChange={(e) => setRawIncome(e.target.value.replace(/\D/g, ''))}
            onBlur={() =>
              income > 0 &&
              setRawIncome(new Intl.NumberFormat('pt-BR').format(income))
            }
            placeholder="0,00"
            className="flex-1 bg-transparent py-4 pr-5 text-[15px] text-surface-foreground placeholder:text-surface-foreground/35 focus:outline-none"
          />
        </div>
      </div>

      <button
        type="button"
        disabled={!canSubmit || submitting}
        onClick={handleSubmit}
        className="mt-2 w-full rounded-2xl bg-background px-5 py-4 text-[15px] font-semibold text-primary transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {submitting ? 'Aguarde...' : 'Confirmar e enviar solicitação →'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Criar `qualificacao/[id]/page.tsx`**

```tsx
import { QualificacaoForm } from '../../_components/qualification-form'

export const metadata = { title: 'Qualificação' }

export default async function QualificacaoPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <QualificacaoForm simulationId={id} />
}
```

**Nota:** Verifique se existe um layout pai em `simulador/` que envolve os formulários em um container centralizado (ex: `SimuladorLayout`). Se sim, a página será automaticamente envolvida por ele — não é necessário adicionar container próprio.

- [ ] **Step 3: Verificar TypeScript**

```bash
cd apps/store && pnpm tsc --noEmit 2>&1 | grep -v node_modules | head -20
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/store/src/app/\(store\)/simulator/qualification/ \
        apps/store/src/app/\(store\)/simulator/_components/qualification-form.tsx
git commit -m "feat(store): cria página de qualificação com coleta de CPF, nascimento, cidade e renda"
```

---

## Task 7: Atualizar queries do console

**Files:**
- Modify: `apps/console/src/app/(private)/simulations/queries.ts`

- [ ] **Step 1: Escrever o arquivo completo atualizado**

```typescript
import { createClient } from '@/lib/supabase/server'

export async function listSimulations() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      client_phone,
      client_email,
      client_cpf,
      client_birthdate,
      client_city,
      client_income,
      desired_amount,
      desired_term_months,
      estimated_rate,
      estimated_payment,
      status,
      created_at,
      products ( name )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}

export type SimulationRow = Awaited<ReturnType<typeof listSimulations>>[number]
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit 2>&1 | grep -v node_modules | head -20
```

Expected: sem erros (ou apenas erros preexistentes não relacionados a `queries.ts`).

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/simulations/queries.ts
git commit -m "feat(console): adiciona campos pessoais ao SELECT de simulações"
```

---

## Task 8: Criar SimulationDetailSheet

**Files:**
- Create: `apps/console/src/app/(private)/simulations/_components/simulation-detail-sheet.tsx`

Context: Sheet lateral que abre ao clicar em uma linha da tabela. Recebe `SimulationRow | null` — abre quando não-null, fecha quando null via `onClose`.

O Sheet do projeto usa `radix-ui` (pacote unificado) e está em `@/components/ui/sheet`.

- [ ] **Step 1: Criar `simulation-detail-sheet.tsx`**

```tsx
'use client'

import { Phone, Mail, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SimulationRow } from '../queries'

// ── Utilitários ──────────────────────────────────────────────────────────────

function simId(id: string): string {
  return 'SIM-' + id.replace(/-/g, '').slice(-8).toUpperCase()
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function maskCPF(cpf: string): string {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return cpf
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`
}

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate)
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

function calcCET(rateMonthly: number): string {
  const cet = (Math.pow(1 + rateMonthly / 100, 12) - 1) * 100
  return cet.toFixed(2).replace('.', ',') + '%'
}

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '')
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return phone
}

function productName(sim: SimulationRow): string {
  const p = Array.isArray(sim.products) ? sim.products[0] : sim.products
  return p?.name ?? '—'
}

// ── Componente ────────────────────────────────────────────────────────────────

type Props = {
  simulation: SimulationRow | null
  onClose: () => void
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value ?? '—'}</span>
    </div>
  )
}

export function SimulationDetailSheet({ simulation, onClose }: Props) {
  const isPreQualificado = simulation?.status === 'pre_qualificado'
  const totalAPagar =
    simulation?.estimated_payment && simulation.desired_term_months
      ? simulation.estimated_payment * simulation.desired_term_months
      : null

  return (
    <Sheet open={simulation !== null} onOpenChange={(open) => { if (!open) onClose() }}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto flex flex-col gap-0 p-0" showCloseButton={false}>
        {simulation && (
          <>
            {/* Header */}
            <SheetHeader className="border-b px-6 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {simId(simulation.id)} · {relativeTime(simulation.created_at)}
                  </p>
                  <SheetTitle className="mt-0.5 text-xl">{simulation.client_name}</SheetTitle>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="size-4" />
                  <span className="sr-only">Fechar</span>
                </Button>
              </div>
              <div className="flex gap-2 mt-2">
                <Badge className={isPreQualificado
                  ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-600'
                  : 'border-border bg-muted text-muted-foreground'
                }>
                  {isPreQualificado ? 'Pré-qualificado' : 'Não qualificado'}
                </Badge>
                <Badge variant="outline">{productName(simulation)}</Badge>
              </div>
            </SheetHeader>

            {/* Dados pessoais */}
            <div className="px-6 py-4 border-b">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dados Pessoais
              </p>
              <div className="divide-y divide-border/50">
                {simulation.client_cpf && (
                  <Row label="CPF" value={maskCPF(simulation.client_cpf)} />
                )}
                {simulation.client_birthdate && (
                  <Row
                    label="Idade"
                    value={`${calcAge(simulation.client_birthdate)} anos`}
                  />
                )}
                {simulation.client_email && (
                  <Row label="E-mail" value={simulation.client_email} />
                )}
                <Row label="Telefone" value={formatPhone(simulation.client_phone)} />
                {simulation.client_city && (
                  <Row label="Cidade" value={simulation.client_city} />
                )}
                {simulation.client_income && (
                  <Row label="Renda mensal" value={brl(Number(simulation.client_income))} />
                )}
              </div>
            </div>

            {/* Condições simuladas */}
            <div className="px-6 py-4 flex-1">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Condições Simuladas
              </p>
              <div className="divide-y divide-border/50">
                <Row label="Valor solicitado" value={brl(Number(simulation.desired_amount))} />
                {simulation.estimated_payment && (
                  <Row label="Parcela mensal" value={brl(Number(simulation.estimated_payment))} />
                )}
                <Row label="Prazo" value={`${simulation.desired_term_months} meses`} />
                {simulation.estimated_rate && (
                  <>
                    <Row
                      label="Taxa"
                      value={`${Number(simulation.estimated_rate).toFixed(2).replace('.', ',')}% a.m.`}
                    />
                    <Row label="CET anual" value={calcCET(Number(simulation.estimated_rate))} />
                  </>
                )}
                {totalAPagar && (
                  <Row label="Total a pagar" value={brl(totalAPagar)} />
                )}
              </div>
            </div>

            {/* Footer */}
            <SheetFooter className="border-t px-6 py-4 flex-row gap-2">
              <Button variant="outline" size="sm" asChild className="flex-1">
                <a href={`tel:${simulation.client_phone}`}>
                  <Phone className="size-4 mr-1.5" />
                  Ligar
                </a>
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="flex-1"
                disabled={!simulation.client_email}
              >
                <a href={simulation.client_email ? `mailto:${simulation.client_email}` : '#'}>
                  <Mail className="size-4 mr-1.5" />
                  E-mail
                </a>
              </Button>
              <Button size="sm" className="flex-1" disabled>
                Converter em proposta
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit 2>&1 | grep -v node_modules | head -20
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/simulations/_components/simulation-detail-sheet.tsx
git commit -m "feat(console): cria SimulationDetailSheet com dados pessoais e condições"
```

---

## Task 9: Reescrever SimulationsList

**Files:**
- Modify: `apps/console/src/app/(private)/simulations/_components/simulations-list.tsx`

Context: Reescrever com novas colunas (Lead, Produto, Valor/Condições, Status, Recebida, Ação), tabs de filtro atualizados, e integração com `SimulationDetailSheet`.

- [ ] **Step 1: Escrever o arquivo completo**

```tsx
'use client'

import { useState } from 'react'
import { ClipboardList, TrendingUp, Wallet, Eye } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { SimulationDetailSheet } from './simulation-detail-sheet'
import type { SimulationRow } from '../queries'

// ── Utilitários ──────────────────────────────────────────────────────────────

function brl(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `há ${mins}min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function productName(sim: SimulationRow): string {
  const p = Array.isArray(sim.products) ? sim.products[0] : sim.products
  return p?.name ?? '—'
}

const PRODUCT_DOT_COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-purple-500', 'bg-rose-500', 'bg-cyan-500',
]

function productDotColor(name: string): string {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return PRODUCT_DOT_COLORS[hash % PRODUCT_DOT_COLORS.length]
}

// ── Tipos e constantes ────────────────────────────────────────────────────────

const STATUS_FILTERS = [
  { label: 'Todas', value: undefined },
  { label: 'Pré-qualificados', value: 'pre_qualificado' },
  { label: 'Não qualificados', value: 'rascunho' },
] as const

interface Props {
  simulations: SimulationRow[]
  activeStatus?: string
}

// ── Componente ────────────────────────────────────────────────────────────────

export function SimulationsList({ simulations, activeStatus }: Props) {
  const [selectedSim, setSelectedSim] = useState<SimulationRow | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | undefined>(activeStatus)

  const total = simulations.length
  const preQualified = simulations.filter((s) => s.status === 'pre_qualificado').length
  const totalVolume = simulations.reduce((sum, s) => sum + Number(s.desired_amount), 0)

  const displayed =
    activeFilter === 'rascunho' || activeFilter === 'pre_qualificado'
      ? simulations.filter((s) => s.status === activeFilter)
      : simulations

  const counts = {
    all: simulations.length,
    pre_qualificado: simulations.filter((s) => s.status === 'pre_qualificado').length,
    rascunho: simulations.filter((s) => s.status === 'rascunho').length,
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de simulações</p>
              <p className="text-2xl font-bold">{total}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pré-qualificados</p>
              <p className="text-2xl font-bold">{preQualified}</p>
            </div>
          </Card>

          <Card className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="size-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Volume simulado</p>
              <p className="truncate text-2xl font-bold">{brl(totalVolume)}</p>
            </div>
          </Card>
        </div>

        {/* Tabs de filtro */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((tab) => {
            const count =
              tab.value === undefined
                ? counts.all
                : tab.value === 'pre_qualificado'
                ? counts.pre_qualificado
                : counts.rascunho
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setActiveFilter(tab.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeFilter === tab.value
                    ? 'bg-foreground text-background'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {tab.label}{' '}
                <span className="opacity-60">{count}</span>
              </button>
            )
          })}
        </div>

        {/* Tabela */}
        {displayed.length === 0 ? (
          <EmptyState />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Lead</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Produto</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                      Valor / Condições
                    </th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-xs font-medium text-muted-foreground">
                      Recebida
                    </th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((sim) => {
                    const name = productName(sim)
                    const dotColor = productDotColor(name)
                    const isPreQualificado = sim.status === 'pre_qualificado'

                    return (
                      <tr
                        key={sim.id}
                        className="cursor-pointer border-b border-border/50 transition-colors last:border-0 hover:bg-muted/30"
                        onClick={() => setSelectedSim(sim)}
                      >
                        {/* Lead */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                              {initials(sim.client_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium">{sim.client_name}</p>
                              {sim.client_email && (
                                <p className="truncate text-xs text-muted-foreground">
                                  {sim.client_email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Produto */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${dotColor}`} />
                            <span className="text-sm">{name}</span>
                          </div>
                        </td>

                        {/* Valor / Condições */}
                        <td className="px-4 py-3">
                          <p className="font-medium tabular-nums">
                            {brl(Number(sim.desired_amount))}
                          </p>
                          <p className="text-xs text-muted-foreground tabular-nums">
                            {sim.desired_term_months}m
                            {sim.estimated_rate
                              ? ` · ${Number(sim.estimated_rate)
                                  .toFixed(2)
                                  .replace('.', ',')}% a.m.`
                              : ''}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge
                            className={
                              isPreQualificado
                                ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                                : ''
                            }
                            variant={isPreQualificado ? undefined : 'secondary'}
                          >
                            {isPreQualificado ? 'Pré-qualificado' : 'Não qualificado'}
                          </Badge>
                        </td>

                        {/* Recebida */}
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {relativeTime(sim.created_at)}
                        </td>

                        {/* Ação */}
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedSim(sim)
                            }}
                          >
                            <Eye className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <SimulationDetailSheet
        simulation={selectedSim}
        onClose={() => setSelectedSim(null)}
      />
    </>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <ClipboardList className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-foreground">Nenhuma simulação ainda</h3>
      <p className="mt-2 max-w-[380px] text-sm text-muted-foreground">
        Quando clientes realizarem simulações na sua loja, elas aparecerão aqui com status e dados
        completos.
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/console && pnpm tsc --noEmit 2>&1 | grep -v node_modules | head -20
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/simulations/_components/simulations-list.tsx
git commit -m "feat(console): reescreve SimulationsList com novas colunas, tabs e sheet de detalhes"
```

---

## Auto-review do plano

### Cobertura da spec

| Requisito | Task |
|---|---|
| Migration 5 campos | Task 1 |
| Regenerar types | Task 2 |
| Email em saveSimulation | Task 3 |
| Email nos 9 forms | Task 4 |
| Email nos 9 resultado + rota qualificacao | Task 5 |
| Página qualificação (CPF, nascimento, cidade, renda) | Task 6 |
| updateAndQualifySimulation | Task 3 |
| Console queries com novos campos | Task 7 |
| SimulationDetailSheet (header, dados pessoais, condições, ações) | Task 8 |
| SimulationsList nova (colunas Lead/Produto/Valor/Status/Recebida) | Task 9 |
| Tabs Todas / Pré-qualificados / Não qualificados | Task 9 |
| Status labels (Pré-qualificado / Não qualificado) | Tasks 8, 9 |
| SIM-XXXXXXXX como ID | Task 8 |
| CPF mascarado | Task 8 |
| Idade calculada de birthdate | Task 8 |
| CET anual calculado | Task 8 |
| Total a pagar calculado | Task 8 |
| Botão "Converter em proposta" (disabled) | Task 8 |
| Ligar / E-mail (links) | Task 8 |

Todos os requisitos cobertos.

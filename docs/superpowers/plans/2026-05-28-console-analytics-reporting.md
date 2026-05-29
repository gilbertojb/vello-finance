# Console Analytics & Reporting — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar dashboard de métricas de funil e comissões, página de Clientes com visão unificada da jornada do lead, seção Financeiro com detalhamento de comissões, e seção Relatórios com origem de leads e vendas no Vello Console.

**Architecture:** Todas as páginas são Server Components que leem dados via Supabase no servidor (fat-server thin-client). Filtros passam por query params na URL. Componentes de tabela e filtros são Client Components mínimos; toda lógica de dados fica em `queries.ts`. Exportações CSV são servidas por Route Handlers.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase (PostgreSQL + RLS), Lucide Icons, Recharts.

**Spec:** `docs/superpowers/specs/2026-05-28-console-analytics-reporting-design.md`

---

## Mapa de Arquivos

**Novos:**
- `supabase/migrations/20260528130000_create_commission_snapshots.sql`
- `supabase/migrations/20260528140000_add_seller_id_to_simulations.sql`
- `apps/console/src/components/date-range-picker.tsx` (movido de proposals/)
- `apps/console/src/app/(private)/(dashboard)/_components/funnel-kpi-cards.tsx`
- `apps/console/src/app/(private)/(dashboard)/_components/commission-kpi-cards.tsx`
- `apps/console/src/app/(private)/clients/page.tsx`
- `apps/console/src/app/(private)/clients/queries.ts`
- `apps/console/src/app/(private)/clients/_components/clients-kpi-cards.tsx`
- `apps/console/src/app/(private)/clients/_components/clients-filters.tsx`
- `apps/console/src/app/(private)/clients/_components/clients-table.tsx`
- `apps/console/src/app/api/export/clients/route.ts`
- `apps/console/src/app/(private)/financeiro/page.tsx`
- `apps/console/src/app/(private)/financeiro/queries.ts`
- `apps/console/src/app/(private)/financeiro/_components/financeiro-kpi-cards.tsx`
- `apps/console/src/app/(private)/financeiro/_components/financeiro-filters.tsx`
- `apps/console/src/app/(private)/financeiro/_components/comissoes-table.tsx`
- `apps/console/src/app/(private)/relatorios/origem-leads/page.tsx`
- `apps/console/src/app/(private)/relatorios/origem-leads/queries.ts`
- `apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-kpi-cards.tsx`
- `apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-filters.tsx`
- `apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-table.tsx`
- `apps/console/src/app/(private)/relatorios/origem-vendas/page.tsx`
- `apps/console/src/app/(private)/relatorios/origem-vendas/queries.ts`
- `apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-kpi-cards.tsx`
- `apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-filters.tsx`
- `apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-table.tsx`
- `apps/console/src/app/api/export/relatorios/origem-leads/route.ts`
- `apps/console/src/app/api/export/relatorios/origem-vendas/route.ts`

**Modificados:**
- `supabase/migrations/...` (2 novos arquivos acima)
- `apps/console/src/app/(private)/(dashboard)/queries.ts`
- `apps/console/src/app/(private)/(dashboard)/page.tsx`
- `apps/console/src/app/(private)/proposals/_components/date-range-picker.tsx` → removido (movido)
- `apps/console/src/components/sidebar/nav-main.tsx`

---

## Task 1: Migration — Tabela `commission_snapshots`

**Contexto:** A tabela está documentada no ADR-001 e na spec de comissões, mas nunca foi criada via migration. Sem ela, o Financeiro e os relatórios de origem de vendas não funcionam.

**Files:**
- Create: `supabase/migrations/20260528130000_create_commission_snapshots.sql`

- [ ] **Step 1: Criar migration**

```sql
-- supabase/migrations/20260528130000_create_commission_snapshots.sql

CREATE TABLE commission_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id               UUID NOT NULL REFERENCES proposals(id),
  product_id                UUID NOT NULL REFERENCES products(id),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  financial_partner_id      UUID REFERENCES financial_partners(id),
  if_commission_pct         NUMERIC(6,3) NOT NULL DEFAULT 0,
  vello_commission_pct      NUMERIC(6,3) NOT NULL DEFAULT 0,
  tenant_commission_pct     NUMERIC(6,3) NOT NULL DEFAULT 0,
  vello_spread_pct          NUMERIC(6,3) NOT NULL DEFAULT 0,
  loan_amount               NUMERIC(12,2),
  if_commission_amount      NUMERIC(10,2),
  vello_commission_amount   NUMERIC(10,2),
  tenant_commission_amount  NUMERIC(10,2),
  paid_at                   TIMESTAMPTZ,
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE commission_snapshots ENABLE ROW LEVEL SECURITY;

-- Backoffice pode tudo (incluindo marcar paid_at)
CREATE POLICY "backoffice_full_access" ON commission_snapshots
  FOR ALL
  USING ((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin', 'financial', 'support'));

-- Tenant só lê seus próprios snapshots
CREATE POLICY "tenant_read_own" ON commission_snapshots
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role') IN ('tenant_admin', 'tenant_operator')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Trigger para captura automática no INSERT de proposta
CREATE OR REPLACE FUNCTION capture_commission_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_product tenant_products%ROWTYPE;
BEGIN
  SELECT * INTO v_tenant_product FROM tenant_products
    WHERE tenant_id = NEW.tenant_id
      AND product_id = NEW.product_id
      AND is_active = true;

  IF FOUND THEN
    INSERT INTO commission_snapshots (
      proposal_id, product_id, tenant_id,
      tenant_commission_pct
    ) VALUES (
      NEW.id, NEW.product_id, NEW.tenant_id,
      COALESCE(v_tenant_product.tenant_commission_pct, 0)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_capture_commission_snapshot
  AFTER INSERT ON proposals
  FOR EACH ROW EXECUTE FUNCTION capture_commission_snapshot();
```

- [ ] **Step 2: Aplicar migration**

```bash
pnpm supabase db push
```

Resultado esperado: migration aplicada sem erros.

- [ ] **Step 3: Regenerar types**

```bash
pnpm db:types
```

Verificar que `commission_snapshots` aparece em `packages/database/src/types.ts`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260528130000_create_commission_snapshots.sql packages/database/src/types.ts
git commit -m "feat(database): cria tabela commission_snapshots com trigger e RLS"
```

---

## Task 2: Migration — Coluna `seller_id` em `simulations`

**Contexto:** A coluna `seller_id` é definida na spec do Sales Team (`2026-05-16-sales-team-design.md`) e necessária para os relatórios de origem. Adicionamos aqui para desbloquear os relatórios; a UI de gestão de vendedores vem em outro plano.

**Files:**
- Create: `supabase/migrations/20260528140000_add_seller_id_to_simulations.sql`

- [ ] **Step 1: Criar migration**

```sql
-- supabase/migrations/20260528140000_add_seller_id_to_simulations.sql
-- NULL = simulação direta (loja própria), UUID = vendedor cadastrado

ALTER TABLE simulations
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL;
```

- [ ] **Step 2: Aplicar e regenerar types**

```bash
pnpm supabase db push && pnpm db:types
```

Verificar que `seller_id: string | null` aparece em `simulations.Row` no `types.ts`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260528140000_add_seller_id_to_simulations.sql packages/database/src/types.ts
git commit -m "feat(database): adiciona seller_id em simulations para origem de leads"
```

---

## Task 3: Mover `DateRangePicker` para componente compartilhado

**Contexto:** O DateRangePicker existe em `proposals/_components/date-range-picker.tsx` mas será necessário em 4+ páginas. Mover para `components/` evita duplicação.

**Files:**
- Create: `apps/console/src/components/date-range-picker.tsx`
- Delete: `apps/console/src/app/(private)/proposals/_components/date-range-picker.tsx`

- [ ] **Step 1: Copiar para `components/`**

Criar `apps/console/src/components/date-range-picker.tsx` com o conteúdo exato de `proposals/_components/date-range-picker.tsx` (nenhuma alteração no código, apenas nova localização).

- [ ] **Step 2: Verificar se DateRangePicker é importado em algum arquivo**

```bash
grep -r "date-range-picker" apps/console/src --include="*.tsx" --include="*.ts"
```

- [ ] **Step 3: Deletar arquivo antigo**

```bash
rm apps/console/src/app/\(private\)/proposals/_components/date-range-picker.tsx
```

- [ ] **Step 4: Commit**

```bash
git add apps/console/src/components/date-range-picker.tsx
git add -u apps/console/src/app/\(private\)/proposals/_components/date-range-picker.tsx
git commit -m "refactor(console): move DateRangePicker para components/ compartilhado"
```

---

## Task 4: Dashboard — Queries de funil e comissões

**Files:**
- Modify: `apps/console/src/app/(private)/(dashboard)/queries.ts`

- [ ] **Step 1: Adicionar `getDashboardFunnelKpis()` ao final do arquivo**

```typescript
// Em (dashboard)/queries.ts — adicionar após as funções existentes

export async function getDashboardFunnelKpis(): Promise<{
  abandonaram: number
  apenasSimularam: number
  emContratacao: number
  contrataram: number
}> {
  const supabase = await createClient()

  const [{ data: allSims }, { data: proposals }] = await Promise.all([
    supabase.from('simulations').select('id, status'),
    supabase.from('proposals').select('id, simulation_id, status'),
  ])

  const sims = allSims ?? []
  const props = proposals ?? []

  const simIdsWithProposal = new Set(props.map((p) => p.simulation_id).filter(Boolean))

  const abandonaram = sims.filter(
    (s) => s.status === 'rascunho' && !simIdsWithProposal.has(s.id)
  ).length

  const apenasSimularam = sims.filter(
    (s) => s.status === 'pre_qualificado' && !simIdsWithProposal.has(s.id)
  ).length

  const emContratacao = props.filter((p) =>
    ['em_analise', 'pre_aprovada', 'necessita_detalhes'].includes(p.status)
  ).length

  const contrataram = props.filter((p) => p.status === 'aprovada').length

  return { abandonaram, apenasSimularam, emContratacao, contrataram }
}

export type DashboardFunnelKpis = Awaited<ReturnType<typeof getDashboardFunnelKpis>>

export async function getDashboardCommissionKpis(): Promise<{
  aReceber: number
  recebidas: number
}> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('commission_snapshots')
    .select('tenant_commission_amount, paid_at')

  const snapshots = data ?? []

  const aReceber = snapshots
    .filter((s) => s.paid_at === null && s.tenant_commission_amount !== null)
    .reduce((sum, s) => sum + Number(s.tenant_commission_amount), 0)

  const recebidas = snapshots
    .filter((s) => s.paid_at !== null && s.tenant_commission_amount !== null)
    .reduce((sum, s) => sum + Number(s.tenant_commission_amount), 0)

  return { aReceber, recebidas }
}

export type DashboardCommissionKpis = Awaited<ReturnType<typeof getDashboardCommissionKpis>>
```

- [ ] **Step 2: Verificar que `proposals` tem coluna `simulation_id`**

```bash
grep "simulation_id" packages/database/src/types.ts | head -5
```

Se não existir, ajustar a query para usar `supabase.from('proposals').select('id, status')` e cruzar via simulations que têm proposal associada:

```typescript
// Alternativa: buscar simulation_ids das proposals via join inverso
const { data: propSims } = await supabase
  .from('proposals')
  .select('id, status, simulations!inner(id)')
```

Usar a versão que funcionar com o schema atual.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/\(dashboard\)/queries.ts
git commit -m "feat(console/dashboard): adiciona queries de funil e comissões"
```

---

## Task 5: Dashboard — Componente `FunnelKpiCards`

**Files:**
- Create: `apps/console/src/app/(private)/(dashboard)/_components/funnel-kpi-cards.tsx`

- [ ] **Step 1: Criar componente**

```typescript
// apps/console/src/app/(private)/(dashboard)/_components/funnel-kpi-cards.tsx
import { ArrowRight, Handshake, RotateCcw, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardFunnelKpis } from '../queries'

interface CardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: 'muted' | 'primary' | 'warning' | 'success'
}

function FunnelCard({ label, value, icon, color }: CardProps) {
  const colorMap = {
    muted:   'border-primary/10 bg-card text-foreground/55',
    primary: 'border-primary/10 bg-card text-primary',
    warning: 'border-primary/10 bg-card text-warning',
    success: 'border-primary/10 bg-card text-success',
  }
  const iconBg = {
    muted:   'bg-foreground/6 text-foreground/40',
    primary: 'bg-primary/8 text-primary',
    warning: 'bg-warning/10 text-warning',
    success: 'bg-success/10 text-success',
  }
  return (
    <div className={cn('rounded-2xl border p-5', colorMap[color])}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">{label}</span>
        <span className={cn('grid size-8 place-items-center rounded-lg', iconBg[color])}>{icon}</span>
      </div>
      <div className={cn('text-3xl font-semibold leading-none tracking-tight', colorMap[color])}>
        {value.toLocaleString('pt-BR')}
      </div>
    </div>
  )
}

interface Props {
  kpis: DashboardFunnelKpis
}

export function FunnelKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <FunnelCard label="Abandonaram" value={kpis.abandonaram} icon={<RotateCcw size={15} />} color="muted" />
      <FunnelCard label="Apenas simularam" value={kpis.apenasSimularam} icon={<Sparkles size={15} />} color="primary" />
      <FunnelCard label="Em contratação" value={kpis.emContratacao} icon={<ArrowRight size={15} />} color="warning" />
      <FunnelCard label="Contrataram" value={kpis.contrataram} icon={<Handshake size={15} />} color="success" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/\(private\)/\(dashboard\)/_components/funnel-kpi-cards.tsx
git commit -m "feat(console/dashboard): componente FunnelKpiCards"
```

---

## Task 6: Dashboard — Componente `CommissionKpiCards`

**Files:**
- Create: `apps/console/src/app/(private)/(dashboard)/_components/commission-kpi-cards.tsx`

- [ ] **Step 1: Criar componente**

```typescript
// apps/console/src/app/(private)/(dashboard)/_components/commission-kpi-cards.tsx
import { CircleDollarSign, Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DashboardCommissionKpis } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  kpis: DashboardCommissionKpis
}

export function CommissionKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Comissões a receber</span>
          <span className="grid size-8 place-items-center rounded-lg bg-warning/10 text-warning">
            <Wallet size={15} />
          </span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-warning">
          {brl(kpis.aReceber)}
        </div>
        <p className="mt-2 text-xs text-foreground/38">Propostas aprovadas, pagamento pendente</p>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Comissões recebidas</span>
          <span className="grid size-8 place-items-center rounded-lg bg-success/10 text-success">
            <CircleDollarSign size={15} />
          </span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-success">
          {brl(kpis.recebidas)}
        </div>
        <p className="mt-2 text-xs text-foreground/38">Confirmado pelo painel admin</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/\(private\)/\(dashboard\)/_components/commission-kpi-cards.tsx
git commit -m "feat(console/dashboard): componente CommissionKpiCards"
```

---

## Task 7: Dashboard — Atualizar página para incluir novos grupos de KPIs

**Files:**
- Modify: `apps/console/src/app/(private)/(dashboard)/page.tsx`

- [ ] **Step 1: Adicionar imports e chamadas paralelas**

Adicionar imports dos novos componentes e queries no topo do arquivo:

```typescript
import { CommissionKpiCards } from './_components/commission-kpi-cards'
import { FunnelKpiCards } from './_components/funnel-kpi-cards'
import {
  getDashboardCommissionKpis,
  getDashboardFunnelKpis,
  getDashboardKpis,
  getPipelineData,
  getProductVolume,
  getRecentActivity,
  getTrendData,
} from './queries'
```

Atualizar o `Promise.all` no body do componente:

```typescript
const [kpis, trend, pipeline, products, activity, funnel, commissions] = await Promise.all([
  getDashboardKpis(),
  getTrendData(),
  getPipelineData(),
  getProductVolume(),
  getRecentActivity(),
  getDashboardFunnelKpis(),
  getDashboardCommissionKpis(),
])
```

- [ ] **Step 2: Adicionar seção de funil após `<KpiCards />`**

Logo após o bloco `{/* KPI Cards */}`, adicionar:

```tsx
{/* Funil de Leads */}
<div className="mt-3.5">
  <div className="mb-2 flex items-center gap-2">
    <span className="text-xs font-medium uppercase tracking-widest text-foreground/38">Funil de leads</span>
    <div className="h-px flex-1 bg-primary/8" />
  </div>
  <FunnelKpiCards kpis={funnel} />
</div>

{/* Comissões */}
<div className="mt-3.5">
  <div className="mb-2 flex items-center gap-2">
    <span className="text-xs font-medium uppercase tracking-widest text-foreground/38">Financeiro</span>
    <div className="h-px flex-1 bg-primary/8" />
  </div>
  <CommissionKpiCards kpis={commissions} />
</div>
```

- [ ] **Step 3: Verificar build**

```bash
pnpm --filter console build 2>&1 | tail -20
```

Resultado esperado: build sem erros de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add apps/console/src/app/\(private\)/\(dashboard\)/page.tsx
git commit -m "feat(console/dashboard): adiciona KPIs de funil e comissões"
```

---

## Task 8: Página Clientes — Queries

**Files:**
- Create: `apps/console/src/app/(private)/clients/queries.ts`

- [ ] **Step 1: Criar arquivo de queries**

```typescript
// apps/console/src/app/(private)/clients/queries.ts
import { createClient } from '@/lib/supabase/server'

export type LeadStage = 'abandonou' | 'simulou' | 'em_contratacao' | 'contratou'

export interface LeadRow {
  id: string
  clientName: string
  product: string
  stage: LeadStage
  desiredAmount: number
  origem: string
  createdAt: string
}

export interface ClientsFilters {
  stage?: string
  product?: string
  de?: string
  ate?: string
}

export async function listLeads(filters: ClientsFilters = {}): Promise<LeadRow[]> {
  const supabase = await createClient()

  const { data: sims, error } = await supabase
    .from('simulations')
    .select(`
      id,
      client_name,
      status,
      desired_amount,
      created_at,
      seller_id,
      products ( name ),
      proposals ( id, status )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error

  const rows: LeadRow[] = (sims ?? []).map((sim) => {
    const productName = (sim.products as { name: string } | null)?.name ?? '—'
    const proposals = Array.isArray(sim.proposals) ? sim.proposals : sim.proposals ? [sim.proposals] : []

    let stage: LeadStage = 'abandonou'
    if (proposals.some((p) => p.status === 'aprovada')) {
      stage = 'contratou'
    } else if (proposals.some((p) => ['em_analise', 'pre_aprovada', 'necessita_detalhes'].includes(p.status))) {
      stage = 'em_contratacao'
    } else if (sim.status === 'pre_qualificado' && proposals.length === 0) {
      stage = 'simulou'
    }

    return {
      id: sim.id,
      clientName: sim.client_name,
      product: productName,
      stage,
      desiredAmount: Number(sim.desired_amount),
      origem: sim.seller_id ? 'Vendedor' : 'Loja própria',
      createdAt: sim.created_at,
    }
  })

  let filtered = rows

  if (filters.stage) {
    filtered = filtered.filter((r) => r.stage === filters.stage)
  }
  if (filters.product) {
    filtered = filtered.filter((r) => r.product === filters.product)
  }
  if (filters.de) {
    filtered = filtered.filter((r) => r.createdAt >= filters.de!)
  }
  if (filters.ate) {
    filtered = filtered.filter((r) => r.createdAt <= filters.ate! + 'T23:59:59Z')
  }

  return filtered
}

export async function getClientsKpis(filters: ClientsFilters = {}): Promise<{
  total: number
  abandonaram: number
  emContratacao: number
  contrataram: number
}> {
  const leads = await listLeads(filters)
  return {
    total: leads.length,
    abandonaram: leads.filter((l) => l.stage === 'abandonou').length,
    emContratacao: leads.filter((l) => l.stage === 'em_contratacao').length,
    contrataram: leads.filter((l) => l.stage === 'contratou').length,
  }
}

export async function listProducts(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').order('name')
  return (data ?? []).map((p) => p.name)
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/\(private\)/clients/queries.ts
git commit -m "feat(console/clients): queries de leads e KPIs"
```

---

## Task 9: Página Clientes — KPI Cards

**Files:**
- Create: `apps/console/src/app/(private)/clients/_components/clients-kpi-cards.tsx`

- [ ] **Step 1: Criar componente**

```typescript
// apps/console/src/app/(private)/clients/_components/clients-kpi-cards.tsx
import { ArrowRight, Handshake, RotateCcw, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardProps {
  label: string
  value: number
  icon: React.ReactNode
  featured?: boolean
  colorClass?: string
}

function Card({ label, value, icon, featured, colorClass = 'text-foreground' }: CardProps) {
  return (
    <div className={cn('rounded-2xl border p-5', featured ? 'border-primary/20 bg-primary/8' : 'border-primary/10 bg-card')}>
      <div className="mb-3.5 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">{label}</span>
        <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary">{icon}</span>
      </div>
      <div className={cn('text-3xl font-semibold leading-none tracking-tight', colorClass)}>
        {value.toLocaleString('pt-BR')}
      </div>
    </div>
  )
}

interface Props {
  total: number
  abandonaram: number
  emContratacao: number
  contrataram: number
}

export function ClientsKpiCards({ total, abandonaram, emContratacao, contrataram }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card featured label="Total de leads" value={total} icon={<Users size={15} />} colorClass="text-primary" />
      <Card label="Abandonaram" value={abandonaram} icon={<RotateCcw size={15} />} colorClass="text-foreground/55" />
      <Card label="Em contratação" value={emContratacao} icon={<ArrowRight size={15} />} colorClass="text-warning" />
      <Card label="Contrataram" value={contrataram} icon={<Handshake size={15} />} colorClass="text-success" />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/\(private\)/clients/_components/clients-kpi-cards.tsx
git commit -m "feat(console/clients): componente ClientsKpiCards"
```

---

## Task 10: Página Clientes — Filtros (Client Component)

**Files:**
- Create: `apps/console/src/app/(private)/clients/_components/clients-filters.tsx`

- [ ] **Step 1: Criar componente**

```typescript
// apps/console/src/app/(private)/clients/_components/clients-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'

import { DateRangePicker } from '@/components/date-range-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  products: string[]
}

const STAGES = [
  { value: 'abandonou',       label: 'Abandonou' },
  { value: 'simulou',         label: 'Simulou' },
  { value: 'em_contratacao',  label: 'Em contratação' },
  { value: 'contratou',       label: 'Contratou' },
]

export function ClientsFilters({ products }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  const push = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`/clients?${next.toString()}`)
    },
    [params, router],
  )

  const dateRange: DateRange | undefined =
    params.get('de') && params.get('ate')
      ? { from: new Date(params.get('de')!), to: new Date(params.get('ate')!) }
      : undefined

  function onDateChange(range: DateRange | undefined) {
    const next = new URLSearchParams(params.toString())
    if (range?.from) next.set('de', format(range.from, 'yyyy-MM-dd'))
    else next.delete('de')
    if (range?.to) next.set('ate', format(range.to, 'yyyy-MM-dd'))
    else next.delete('ate')
    router.push(`/clients?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={params.get('stage') ?? 'all'} onValueChange={(v) => push('stage', v === 'all' ? undefined : v)}>
        <SelectTrigger className="h-9 w-40 text-xs">
          <SelectValue placeholder="Estágio" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os estágios</SelectItem>
          {STAGES.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={params.get('product') ?? 'all'} onValueChange={(v) => push('product', v === 'all' ? undefined : v)}>
        <SelectTrigger className="h-9 w-44 text-xs">
          <SelectValue placeholder="Produto" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos os produtos</SelectItem>
          {products.map((p) => (
            <SelectItem key={p} value={p}>{p}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <DateRangePicker value={dateRange} onChange={onDateChange} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/\(private\)/clients/_components/clients-filters.tsx
git commit -m "feat(console/clients): componente ClientsFilters com query params"
```

---

## Task 11: Página Clientes — Tabela (Client Component)

**Files:**
- Create: `apps/console/src/app/(private)/clients/_components/clients-table.tsx`

- [ ] **Step 1: Criar componente**

```typescript
// apps/console/src/app/(private)/clients/_components/clients-table.tsx
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { LeadRow, LeadStage } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR')
}

const STAGE_CONFIG: Record<LeadStage, { label: string; bg: string; color: string }> = {
  abandonou:       { label: 'Abandonou',        bg: 'color-mix(in oklch, var(--muted-foreground) 12%, transparent)', color: 'var(--muted-foreground)' },
  simulou:         { label: 'Simulou',           bg: 'color-mix(in oklch, var(--primary) 14%, transparent)',          color: 'var(--primary)' },
  em_contratacao:  { label: 'Em contratação',   bg: 'color-mix(in oklch, var(--warning) 14%, transparent)',          color: 'var(--warning)' },
  contratou:       { label: 'Contratou',         bg: 'color-mix(in oklch, var(--success) 14%, transparent)',          color: 'var(--success)' },
}

function StagePill({ stage }: { stage: LeadStage }) {
  const cfg = STAGE_CONFIG[stage]
  return (
    <span
      style={{ background: cfg.bg, color: cfg.color }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide"
    >
      <span className="size-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  )
}

interface Props {
  leads: LeadRow[]
}

const PAGE_SIZE = 20

export function ClientsTable({ leads }: Props) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(leads.length / PAGE_SIZE))
  const pageData = leads.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary/10 bg-foreground/2">
            {['Cliente', 'Produto', 'Estágio', 'Valor solicitado', 'Origem', 'Data'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/40">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-10 text-center text-sm text-foreground/38">
                Nenhum lead encontrado.
              </td>
            </tr>
          )}
          {pageData.map((lead, i) => {
            const isLast = i === pageData.length - 1
            return (
              <tr key={lead.id} className="hover:bg-foreground/2">
                <td className={cn('p-4 font-medium', !isLast && 'border-b border-primary/8')}>
                  <span className="text-sm">{lead.clientName}</span>
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span className="text-sm text-foreground/70">{lead.product}</span>
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <StagePill stage={lead.stage} />
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span className="text-sm font-medium">{brl(lead.desiredAmount)}</span>
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span className="text-xs text-foreground/55">{lead.origem}</span>
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span className="text-xs text-foreground/55">{formatDate(lead.createdAt)}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-primary/10 bg-foreground/2 px-4 py-4 text-xs text-foreground/55">
        <span>
          Mostrando <span className="font-medium text-foreground">{pageData.length}</span> de <span className="font-medium text-foreground">{leads.length}</span> leads
        </span>
        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="grid size-8 place-items-center rounded-lg text-xs font-medium disabled:opacity-30">←</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = i + 1
            return (
              <button key={p} type="button" onClick={() => setPage(p)} className={cn('grid size-8 place-items-center rounded-lg text-xs', p === page ? 'bg-primary font-semibold text-primary-foreground' : 'font-medium text-foreground/55')}>
                {p}
              </button>
            )
          })}
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="grid size-8 place-items-center rounded-lg text-xs font-medium disabled:opacity-30">→</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/\(private\)/clients/_components/clients-table.tsx
git commit -m "feat(console/clients): tabela de leads com paginação e estágios"
```

---

## Task 12: Página Clientes — Route Handler de exportação + page.tsx

**Files:**
- Create: `apps/console/src/app/api/export/clients/route.ts`
- Create: `apps/console/src/app/(private)/clients/page.tsx`

- [ ] **Step 1: Criar Route Handler de CSV**

```typescript
// apps/console/src/app/api/export/clients/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { listLeads } from '@/app/(private)/clients/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const filters = {
    stage:    searchParams.get('stage') ?? undefined,
    product:  searchParams.get('product') ?? undefined,
    de:       searchParams.get('de') ?? undefined,
    ate:      searchParams.get('ate') ?? undefined,
  }

  const leads = await listLeads(filters)

  const header = 'Nome,Produto,Estágio,Valor solicitado,Origem,Data\n'
  const rows = leads.map((l) =>
    [
      `"${l.clientName}"`,
      `"${l.product}"`,
      `"${l.stage}"`,
      l.desiredAmount,
      `"${l.origem}"`,
      `"${new Date(l.createdAt).toLocaleDateString('pt-BR')}"`,
    ].join(',')
  )

  return new NextResponse(header + rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="leads.csv"',
    },
  })
}
```

- [ ] **Step 2: Criar page.tsx**

```typescript
// apps/console/src/app/(private)/clients/page.tsx
import type { Metadata } from 'next'
import { Download } from 'lucide-react'

import { ClientsFilters } from './_components/clients-filters'
import { ClientsKpiCards } from './_components/clients-kpi-cards'
import { ClientsTable } from './_components/clients-table'
import { getClientsKpis, listLeads, listProducts } from './queries'

export const metadata: Metadata = { title: 'Clientes' }

interface Props {
  searchParams: Promise<{ stage?: string; product?: string; de?: string; ate?: string }>
}

export default async function ClientsPage({ searchParams }: Props) {
  const filters = await searchParams
  const [leads, kpis, products] = await Promise.all([
    listLeads(filters),
    getClientsKpis(filters),
    listProducts(),
  ])

  const csvParams = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined)) as Record<string, string>
  )

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
            Originação · Jornada do lead
          </span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Clientes<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            Visão unificada da jornada — de quem abandonou a simulação até quem contratou.
          </p>
        </div>
        <a
          href={`/api/export/clients?${csvParams.toString()}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground no-underline"
        >
          <Download size={14} /> Exportar CSV
        </a>
      </div>

      <ClientsKpiCards
        total={kpis.total}
        abandonaram={kpis.abandonaram}
        emContratacao={kpis.emContratacao}
        contrataram={kpis.contrataram}
      />

      <div className="mt-4">
        <ClientsFilters products={products} />
      </div>

      <div className="mt-3.5">
        <ClientsTable leads={leads} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar build**

```bash
pnpm --filter console build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/console/src/app/api/export/clients/route.ts apps/console/src/app/\(private\)/clients/page.tsx
git commit -m "feat(console/clients): página completa com exportação CSV"
```

---

## Task 13: Sidebar — Ativar Clientes + adicionar Financeiro e Relatórios

**Files:**
- Modify: `apps/console/src/components/sidebar/nav-main.tsx`

- [ ] **Step 1: Atualizar `sections` no componente**

Substituir o array `sections` inteiro pelo seguinte (mantendo a lógica de queries existente no topo do componente):

```typescript
const sections = [
  {
    label: 'Visão Geral',
    items: [
      { href: '/', icon: <LayoutDashboard className="size-4" />, label: 'Dashboard' },
      { href: '/analytics', icon: <BarChart2 className="size-4" />, label: 'Analytics', disabled: true },
    ],
  },
  {
    label: 'Originação',
    items: [
      { href: '/simulations', icon: <ClipboardList className="size-4" />, label: 'Simulações', badge: simCount ?? 0 },
      { href: '/proposals', icon: <FileText className="size-4" />, label: 'Propostas', badge: propCount ?? 0 },
      { href: '/clients', icon: <Users className="size-4" />, label: 'Clientes' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { href: '/financeiro', icon: <CircleDollarSign className="size-4" />, label: 'Comissões' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { href: '/products', icon: <Package className="size-4" />, label: 'Produtos' },
      { href: '/campaigns', icon: <Megaphone className="size-4" />, label: 'Campanhas', disabled: true },
    ],
  },
  {
    label: 'Relatórios',
    items: [
      { href: '/relatorios/origem-leads', icon: <TrendingUp className="size-4" />, label: 'Origem de Leads' },
      { href: '/relatorios/origem-vendas', icon: <BarChart3 className="size-4" />, label: 'Origem de Vendas' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/usuarios', icon: <UserCog className="size-4" />, label: 'Usuários' },
      { href: '/store-settings', icon: <Settings className="size-4" />, label: 'Configurações' },
    ],
  },
]
```

- [ ] **Step 2: Adicionar imports necessários**

Adicionar ao bloco de imports do Lucide:

```typescript
import {
  BarChart2,
  BarChart3,
  CircleDollarSign,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react'
```

- [ ] **Step 3: Verificar build**

```bash
pnpm --filter console build 2>&1 | tail -20
```

- [ ] **Step 4: Commit**

```bash
git add apps/console/src/components/sidebar/nav-main.tsx
git commit -m "feat(console/sidebar): ativa Clientes, adiciona Financeiro e Relatórios"
```

---

## Task 14: Financeiro — Queries

**Files:**
- Create: `apps/console/src/app/(private)/financeiro/queries.ts`

- [ ] **Step 1: Criar queries**

```typescript
// apps/console/src/app/(private)/financeiro/queries.ts
import { createClient } from '@/lib/supabase/server'

export interface ComissaoRow {
  id: string
  clientName: string
  product: string
  loanAmount: number | null
  commissionPct: number
  commissionAmount: number | null
  pago: boolean
  capturedAt: string
}

export interface FinanceiroFilters {
  status?: 'a_receber' | 'pago'
  de?: string
  ate?: string
}

export async function listComissoes(filters: FinanceiroFilters = {}): Promise<ComissaoRow[]> {
  const supabase = await createClient()

  const query = supabase
    .from('commission_snapshots')
    .select(`
      id,
      tenant_commission_pct,
      tenant_commission_amount,
      loan_amount,
      paid_at,
      captured_at,
      proposals (
        client_name,
        products ( name )
      )
    `)
    .order('captured_at', { ascending: false })

  const { data, error } = await query
  if (error) throw error

  let rows: ComissaoRow[] = (data ?? []).map((s) => {
    const proposal = Array.isArray(s.proposals) ? s.proposals[0] : s.proposals
    const productData = proposal
      ? (Array.isArray((proposal as any).products) ? (proposal as any).products[0] : (proposal as any).products)
      : null

    return {
      id: s.id,
      clientName: (proposal as any)?.client_name ?? '—',
      product: productData?.name ?? '—',
      loanAmount: s.loan_amount ? Number(s.loan_amount) : null,
      commissionPct: Number(s.tenant_commission_pct),
      commissionAmount: s.tenant_commission_amount ? Number(s.tenant_commission_amount) : null,
      pago: s.paid_at !== null,
      capturedAt: s.captured_at,
    }
  })

  if (filters.status === 'a_receber') rows = rows.filter((r) => !r.pago)
  if (filters.status === 'pago') rows = rows.filter((r) => r.pago)
  if (filters.de) rows = rows.filter((r) => r.capturedAt >= filters.de!)
  if (filters.ate) rows = rows.filter((r) => r.capturedAt <= filters.ate! + 'T23:59:59Z')

  return rows
}

export async function getFinanceiroKpis(filters: FinanceiroFilters = {}): Promise<{
  aReceber: number
  recebidas: number
  proximoPagamento: string | null
}> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('commission_snapshots')
    .select('tenant_commission_amount, paid_at, captured_at')

  const all = data ?? []

  const aReceber = all
    .filter((s) => !s.paid_at && s.tenant_commission_amount)
    .reduce((sum, s) => sum + Number(s.tenant_commission_amount), 0)

  const recebidas = all
    .filter((s) => s.paid_at && s.tenant_commission_amount)
    .reduce((sum, s) => sum + Number(s.tenant_commission_amount), 0)

  const proximos = all.filter((s) => !s.paid_at && s.tenant_commission_amount)
  const proximoPagamento = proximos.length > 0
    ? proximos.sort((a, b) => a.captured_at.localeCompare(b.captured_at))[0]!.captured_at.slice(0, 10)
    : null

  return { aReceber, recebidas, proximoPagamento }
}

export type FinanceiroKpis = Awaited<ReturnType<typeof getFinanceiroKpis>>
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/app/\(private\)/financeiro/queries.ts
git commit -m "feat(console/financeiro): queries de comissões"
```

---

## Task 15: Financeiro — KPI Cards, Filtros e Tabela

**Files:**
- Create: `apps/console/src/app/(private)/financeiro/_components/financeiro-kpi-cards.tsx`
- Create: `apps/console/src/app/(private)/financeiro/_components/financeiro-filters.tsx`
- Create: `apps/console/src/app/(private)/financeiro/_components/comissoes-table.tsx`

- [ ] **Step 1: Criar `financeiro-kpi-cards.tsx`**

```typescript
// apps/console/src/app/(private)/financeiro/_components/financeiro-kpi-cards.tsx
import { CalendarClock, CircleDollarSign, Wallet } from 'lucide-react'
import type { FinanceiroKpis } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  kpis: FinanceiroKpis
}

export function FinanceiroKpiCards({ kpis }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-warning/20 bg-warning/5 p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">A receber</span>
          <span className="grid size-8 place-items-center rounded-lg bg-warning/10 text-warning"><Wallet size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-warning">{brl(kpis.aReceber)}</div>
        <p className="mt-2 text-xs text-foreground/38">Propostas aprovadas, pagamento pendente</p>
      </div>

      <div className="rounded-2xl border border-success/20 bg-success/5 p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Recebidas</span>
          <span className="grid size-8 place-items-center rounded-lg bg-success/10 text-success"><CircleDollarSign size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-success">{brl(kpis.recebidas)}</div>
        <p className="mt-2 text-xs text-foreground/38">Confirmado pelo painel admin</p>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Próximo pagamento</span>
          <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary"><CalendarClock size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">
          {kpis.proximoPagamento
            ? new Date(kpis.proximoPagamento).toLocaleDateString('pt-BR')
            : '—'}
        </div>
        <p className="mt-2 text-xs text-foreground/38">Estimativa baseada em data de captura</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar `financeiro-filters.tsx`**

```typescript
// apps/console/src/app/(private)/financeiro/_components/financeiro-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'

import { DateRangePicker } from '@/components/date-range-picker'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function FinanceiroFilters() {
  const router = useRouter()
  const params = useSearchParams()

  const push = useCallback(
    (key: string, value: string | undefined) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`/financeiro?${next.toString()}`)
    },
    [params, router],
  )

  const dateRange: DateRange | undefined =
    params.get('de') && params.get('ate')
      ? { from: new Date(params.get('de')!), to: new Date(params.get('ate')!) }
      : undefined

  function onDateChange(range: DateRange | undefined) {
    const next = new URLSearchParams(params.toString())
    if (range?.from) next.set('de', format(range.from, 'yyyy-MM-dd'))
    else next.delete('de')
    if (range?.to) next.set('ate', format(range.to, 'yyyy-MM-dd'))
    else next.delete('ate')
    router.push(`/financeiro?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={params.get('status') ?? 'all'} onValueChange={(v) => push('status', v === 'all' ? undefined : v)}>
        <SelectTrigger className="h-9 w-40 text-xs">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="a_receber">A receber</SelectItem>
          <SelectItem value="pago">Pago</SelectItem>
        </SelectContent>
      </Select>
      <DateRangePicker value={dateRange} onChange={onDateChange} />
    </div>
  )
}
```

- [ ] **Step 3: Criar `comissoes-table.tsx`**

```typescript
// apps/console/src/app/(private)/financeiro/_components/comissoes-table.tsx
'use client'

import { cn } from '@/lib/utils'
import type { ComissaoRow } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  comissoes: ComissaoRow[]
}

export function ComissoesTable({ comissoes }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary/10 bg-foreground/2">
            {['Cliente', 'Produto', 'Valor financiado', '% Comissão', 'Comissão', 'Status', 'Data'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/40">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {comissoes.length === 0 && (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-sm text-foreground/38">
                Nenhuma comissão encontrada.
              </td>
            </tr>
          )}
          {comissoes.map((c, i) => {
            const isLast = i === comissoes.length - 1
            return (
              <tr key={c.id} className="hover:bg-foreground/2">
                <td className={cn('p-4 text-sm font-medium', !isLast && 'border-b border-primary/8')}>{c.clientName}</td>
                <td className={cn('p-4 text-sm text-foreground/70', !isLast && 'border-b border-primary/8')}>{c.product}</td>
                <td className={cn('p-4 text-sm', !isLast && 'border-b border-primary/8')}>
                  {c.loanAmount ? brl(c.loanAmount) : <span className="text-foreground/38">—</span>}
                </td>
                <td className={cn('p-4 text-sm', !isLast && 'border-b border-primary/8')}>
                  {c.commissionPct.toFixed(3)}%
                </td>
                <td className={cn('p-4 text-sm font-semibold', !isLast && 'border-b border-primary/8')}>
                  {c.commissionAmount ? brl(c.commissionAmount) : <span className="text-foreground/38 font-normal">Pendente aprovação</span>}
                </td>
                <td className={cn('p-4', !isLast && 'border-b border-primary/8')}>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: c.pago
                        ? 'color-mix(in oklch, var(--success) 14%, transparent)'
                        : 'color-mix(in oklch, var(--warning) 14%, transparent)',
                      color: c.pago ? 'var(--success)' : 'var(--warning)',
                    }}
                  >
                    <span className="size-1.5 rounded-full" style={{ background: c.pago ? 'var(--success)' : 'var(--warning)' }} />
                    {c.pago ? 'Pago' : 'A receber'}
                  </span>
                </td>
                <td className={cn('p-4 text-xs text-foreground/55', !isLast && 'border-b border-primary/8')}>
                  {new Date(c.capturedAt).toLocaleDateString('pt-BR')}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/console/src/app/\(private\)/financeiro/_components/
git commit -m "feat(console/financeiro): componentes de KPI cards, filtros e tabela"
```

---

## Task 16: Financeiro — page.tsx

**Files:**
- Create: `apps/console/src/app/(private)/financeiro/page.tsx`

- [ ] **Step 1: Criar página**

```typescript
// apps/console/src/app/(private)/financeiro/page.tsx
import type { Metadata } from 'next'

import { ComissoesTable } from './_components/comissoes-table'
import { FinanceiroFilters } from './_components/financeiro-filters'
import { FinanceiroKpiCards } from './_components/financeiro-kpi-cards'
import { getFinanceiroKpis, listComissoes, type FinanceiroFilters as Filters } from './queries'

export const metadata: Metadata = { title: 'Financeiro' }

interface Props {
  searchParams: Promise<{ status?: string; de?: string; ate?: string }>
}

export default async function FinanceiroPage({ searchParams }: Props) {
  const params = await searchParams
  const filters: Filters = {
    status: (params.status as Filters['status']) ?? undefined,
    de: params.de,
    ate: params.ate,
  }

  const [kpis, comissoes] = await Promise.all([
    getFinanceiroKpis(filters),
    listComissoes(filters),
  ])

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <div className="mb-7">
        <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">
          Financeiro · Comissões
        </span>
        <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
          Financeiro<span className="text-primary">.</span>
        </h1>
        <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
          Histórico de comissões por proposta. Pagamentos são confirmados pelo painel admin.
        </p>
      </div>

      <FinanceiroKpiCards kpis={kpis} />

      <div className="mt-4">
        <FinanceiroFilters />
      </div>

      <div className="mt-3.5">
        <ComissoesTable comissoes={comissoes} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
pnpm --filter console build 2>&1 | tail -20
```

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/\(private\)/financeiro/page.tsx
git commit -m "feat(console/financeiro): página de comissões"
```

---

## Task 17: Relatórios — Origem de Leads (queries + componentes + página)

**Files:**
- Create: `apps/console/src/app/(private)/relatorios/origem-leads/queries.ts`
- Create: `apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-kpi-cards.tsx`
- Create: `apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-filters.tsx`
- Create: `apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-table.tsx`
- Create: `apps/console/src/app/(private)/relatorios/origem-leads/page.tsx`
- Create: `apps/console/src/app/api/export/relatorios/origem-leads/route.ts`

- [ ] **Step 1: Criar `queries.ts`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-leads/queries.ts
import { createClient } from '@/lib/supabase/server'

export interface OrigemLeadRow {
  origem: string
  leads: number
  convertidos: number
  taxa: number
  volume: number
}

export interface OrigemLeadsFilters {
  de?: string
  ate?: string
  product?: string
}

export async function listOrigemLeads(filters: OrigemLeadsFilters = {}): Promise<OrigemLeadRow[]> {
  const supabase = await createClient()

  let q = supabase
    .from('simulations')
    .select(`
      id,
      desired_amount,
      seller_id,
      created_at,
      products ( name ),
      proposals ( id, status )
    `)

  if (filters.de) q = q.gte('created_at', filters.de)
  if (filters.ate) q = q.lte('created_at', filters.ate + 'T23:59:59Z')

  const { data, error } = await q
  if (error) throw error

  let sims = data ?? []

  if (filters.product) {
    sims = sims.filter((s) => {
      const p = s.products as { name: string } | null
      return p?.name === filters.product
    })
  }

  const map = new Map<string, { leads: number; convertidos: number; volume: number }>()

  for (const sim of sims) {
    const origem = sim.seller_id ? 'Vendedor' : 'Loja própria'
    const proposals = Array.isArray(sim.proposals) ? sim.proposals : sim.proposals ? [sim.proposals] : []
    const convertido = proposals.some((p) => p.status === 'aprovada')

    const entry = map.get(origem) ?? { leads: 0, convertidos: 0, volume: 0 }
    entry.leads++
    if (convertido) entry.convertidos++
    entry.volume += Number(sim.desired_amount)
    map.set(origem, entry)
  }

  return Array.from(map.entries())
    .map(([origem, stats]) => ({
      origem,
      leads: stats.leads,
      convertidos: stats.convertidos,
      taxa: stats.leads > 0 ? Math.round((stats.convertidos / stats.leads) * 1000) / 10 : 0,
      volume: stats.volume,
    }))
    .sort((a, b) => b.leads - a.leads)
}

export async function getOrigemLeadsKpis(filters: OrigemLeadsFilters = {}): Promise<{
  total: number
  lojaPropriaCount: number
  vendedoresCount: number
}> {
  const rows = await listOrigemLeads(filters)
  return {
    total: rows.reduce((s, r) => s + r.leads, 0),
    lojaPropriaCount: rows.find((r) => r.origem === 'Loja própria')?.leads ?? 0,
    vendedoresCount: rows.filter((r) => r.origem !== 'Loja própria').reduce((s, r) => s + r.leads, 0),
  }
}
```

- [ ] **Step 2: Criar `origem-leads-kpi-cards.tsx`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-kpi-cards.tsx
import { ShoppingBag, UserCheck, Users } from 'lucide-react'

interface Props {
  total: number
  lojaPropriaCount: number
  vendedoresCount: number
}

export function OrigemLeadsKpiCards({ total, lojaPropriaCount, vendedoresCount }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-primary/20 bg-primary/8 p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Total de leads</span>
          <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary"><Users size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-primary">{total.toLocaleString('pt-BR')}</div>
      </div>
      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Pela loja própria</span>
          <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary"><ShoppingBag size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">{lojaPropriaCount.toLocaleString('pt-BR')}</div>
      </div>
      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Por vendedores</span>
          <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary"><UserCheck size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">{vendedoresCount.toLocaleString('pt-BR')}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar `origem-leads-filters.tsx`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { DateRangePicker } from '@/components/date-range-picker'

export function OrigemLeadsFilters() {
  const router = useRouter()
  const params = useSearchParams()

  const dateRange: DateRange | undefined =
    params.get('de') && params.get('ate')
      ? { from: new Date(params.get('de')!), to: new Date(params.get('ate')!) }
      : undefined

  function onDateChange(range: DateRange | undefined) {
    const next = new URLSearchParams(params.toString())
    if (range?.from) next.set('de', format(range.from, 'yyyy-MM-dd'))
    else next.delete('de')
    if (range?.to) next.set('ate', format(range.to, 'yyyy-MM-dd'))
    else next.delete('ate')
    router.push(`/relatorios/origem-leads?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker value={dateRange} onChange={onDateChange} />
    </div>
  )
}
```

- [ ] **Step 4: Criar `origem-leads-table.tsx`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-leads/_components/origem-leads-table.tsx
import { cn } from '@/lib/utils'
import type { OrigemLeadRow } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  rows: OrigemLeadRow[]
}

export function OrigemLeadsTable({ rows }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary/10 bg-foreground/2">
            {['Origem', 'Leads', 'Convertidos', 'Taxa de conversão', 'Volume solicitado'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-foreground/38">Nenhum dado encontrado.</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.origem} className="hover:bg-foreground/2">
              <td className={cn('p-4 text-sm font-medium', i < rows.length - 1 && 'border-b border-primary/8')}>{r.origem}</td>
              <td className={cn('p-4 text-sm', i < rows.length - 1 && 'border-b border-primary/8')}>{r.leads.toLocaleString('pt-BR')}</td>
              <td className={cn('p-4 text-sm', i < rows.length - 1 && 'border-b border-primary/8')}>{r.convertidos.toLocaleString('pt-BR')}</td>
              <td className={cn('p-4 text-sm', i < rows.length - 1 && 'border-b border-primary/8')}>
                <span className={r.taxa >= 5 ? 'text-success font-semibold' : ''}>{r.taxa.toFixed(1)}%</span>
              </td>
              <td className={cn('p-4 text-sm', i < rows.length - 1 && 'border-b border-primary/8')}>{brl(r.volume)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Criar `page.tsx`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-leads/page.tsx
import type { Metadata } from 'next'
import { Download } from 'lucide-react'

import { OrigemLeadsFilters } from './_components/origem-leads-filters'
import { OrigemLeadsKpiCards } from './_components/origem-leads-kpi-cards'
import { OrigemLeadsTable } from './_components/origem-leads-table'
import { getOrigemLeadsKpis, listOrigemLeads, type OrigemLeadsFilters as Filters } from './queries'

export const metadata: Metadata = { title: 'Origem de Leads' }

interface Props {
  searchParams: Promise<{ de?: string; ate?: string; product?: string }>
}

export default async function OrigemLeadsPage({ searchParams }: Props) {
  const params = await searchParams
  const filters: Filters = { de: params.de, ate: params.ate, product: params.product }

  const [rows, kpis] = await Promise.all([
    listOrigemLeads(filters),
    getOrigemLeadsKpis(filters),
  ])

  const csvParams = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined)) as Record<string, string>
  )

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">Relatórios · Origem</span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Origem de Leads<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            De onde vieram seus leads — loja própria vs. vendedores cadastrados.
          </p>
        </div>
        <a
          href={`/api/export/relatorios/origem-leads?${csvParams.toString()}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground no-underline"
        >
          <Download size={14} /> Exportar CSV
        </a>
      </div>

      <OrigemLeadsKpiCards total={kpis.total} lojaPropriaCount={kpis.lojaPropriaCount} vendedoresCount={kpis.vendedoresCount} />

      <div className="mt-4"><OrigemLeadsFilters /></div>
      <div className="mt-3.5"><OrigemLeadsTable rows={rows} /></div>
    </div>
  )
}
```

- [ ] **Step 6: Criar Route Handler de CSV**

```typescript
// apps/console/src/app/api/export/relatorios/origem-leads/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { listOrigemLeads } from '@/app/(private)/relatorios/origem-leads/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const rows = await listOrigemLeads({
    de: searchParams.get('de') ?? undefined,
    ate: searchParams.get('ate') ?? undefined,
    product: searchParams.get('product') ?? undefined,
  })

  const header = 'Origem,Leads,Convertidos,Taxa de conversão (%),Volume solicitado (R$)\n'
  const body = rows
    .map((r) => `"${r.origem}",${r.leads},${r.convertidos},${r.taxa},${r.volume}`)
    .join('\n')

  return new NextResponse(header + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="origem-leads.csv"',
    },
  })
}
```

- [ ] **Step 7: Verificar build e commitar**

```bash
pnpm --filter console build 2>&1 | tail -20
git add apps/console/src/app/\(private\)/relatorios/origem-leads/ apps/console/src/app/api/export/relatorios/origem-leads/
git commit -m "feat(console/relatorios): página Origem de Leads com exportação CSV"
```

---

## Task 18: Relatórios — Origem de Vendas (queries + componentes + página)

**Files:**
- Create: `apps/console/src/app/(private)/relatorios/origem-vendas/queries.ts`
- Create: `apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-kpi-cards.tsx`
- Create: `apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-filters.tsx`
- Create: `apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-table.tsx`
- Create: `apps/console/src/app/(private)/relatorios/origem-vendas/page.tsx`
- Create: `apps/console/src/app/api/export/relatorios/origem-vendas/route.ts`

- [ ] **Step 1: Criar `queries.ts`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-vendas/queries.ts
import { createClient } from '@/lib/supabase/server'

export interface OrigemVendaRow {
  origem: string
  propostasAprovadas: number
  volumeContratado: number
  comissaoGerada: number
}

export interface OrigemVendasFilters {
  de?: string
  ate?: string
}

export async function listOrigemVendas(filters: OrigemVendasFilters = {}): Promise<OrigemVendaRow[]> {
  const supabase = await createClient()

  let q = supabase
    .from('proposals')
    .select(`
      id,
      status,
      simulations (
        seller_id,
        desired_amount
      ),
      commission_snapshots (
        tenant_commission_amount,
        loan_amount
      )
    `)
    .eq('status', 'aprovada')

  if (filters.de) q = q.gte('created_at', filters.de)
  if (filters.ate) q = q.lte('created_at', filters.ate + 'T23:59:59Z')

  const { data, error } = await q
  if (error) throw error

  const map = new Map<string, { count: number; volume: number; comissao: number }>()

  for (const p of data ?? []) {
    const sim = Array.isArray(p.simulations) ? p.simulations[0] : p.simulations
    const snap = Array.isArray(p.commission_snapshots) ? p.commission_snapshots[0] : p.commission_snapshots

    const origem = (sim as any)?.seller_id ? 'Vendedor' : 'Loja própria'
    const volume = Number((sim as any)?.desired_amount ?? 0)
    const comissao = Number((snap as any)?.tenant_commission_amount ?? 0)

    const entry = map.get(origem) ?? { count: 0, volume: 0, comissao: 0 }
    entry.count++
    entry.volume += volume
    entry.comissao += comissao
    map.set(origem, entry)
  }

  return Array.from(map.entries())
    .map(([origem, s]) => ({
      origem,
      propostasAprovadas: s.count,
      volumeContratado: s.volume,
      comissaoGerada: s.comissao,
    }))
    .sort((a, b) => b.propostasAprovadas - a.propostasAprovadas)
}

export async function getOrigemVendasKpis(filters: OrigemVendasFilters = {}): Promise<{
  totalAprovadas: number
  lojaPropriaAprovadas: number
  vendedoresAprovadas: number
}> {
  const rows = await listOrigemVendas(filters)
  return {
    totalAprovadas: rows.reduce((s, r) => s + r.propostasAprovadas, 0),
    lojaPropriaAprovadas: rows.find((r) => r.origem === 'Loja própria')?.propostasAprovadas ?? 0,
    vendedoresAprovadas: rows.filter((r) => r.origem !== 'Loja própria').reduce((s, r) => s + r.propostasAprovadas, 0),
  }
}
```

- [ ] **Step 2: Criar `origem-vendas-kpi-cards.tsx`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-kpi-cards.tsx
import { CheckCircle, ShoppingBag, UserCheck } from 'lucide-react'

interface Props {
  totalAprovadas: number
  lojaPropriaAprovadas: number
  vendedoresAprovadas: number
}

export function OrigemVendasKpiCards({ totalAprovadas, lojaPropriaAprovadas, vendedoresAprovadas }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-2xl border border-primary/20 bg-primary/8 p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Total aprovadas</span>
          <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary"><CheckCircle size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-primary">{totalAprovadas.toLocaleString('pt-BR')}</div>
      </div>
      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Pela loja própria</span>
          <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary"><ShoppingBag size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">{lojaPropriaAprovadas.toLocaleString('pt-BR')}</div>
      </div>
      <div className="rounded-2xl border border-primary/10 bg-card p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/55">Por vendedores</span>
          <span className="grid size-8 place-items-center rounded-lg bg-primary/8 text-primary"><UserCheck size={15} /></span>
        </div>
        <div className="text-3xl font-semibold leading-none tracking-tight text-foreground">{vendedoresAprovadas.toLocaleString('pt-BR')}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar `origem-vendas-filters.tsx`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-filters.tsx
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import type { DateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { DateRangePicker } from '@/components/date-range-picker'

export function OrigemVendasFilters() {
  const router = useRouter()
  const params = useSearchParams()

  const dateRange: DateRange | undefined =
    params.get('de') && params.get('ate')
      ? { from: new Date(params.get('de')!), to: new Date(params.get('ate')!) }
      : undefined

  function onDateChange(range: DateRange | undefined) {
    const next = new URLSearchParams(params.toString())
    if (range?.from) next.set('de', format(range.from, 'yyyy-MM-dd'))
    else next.delete('de')
    if (range?.to) next.set('ate', format(range.to, 'yyyy-MM-dd'))
    else next.delete('ate')
    router.push(`/relatorios/origem-vendas?${next.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DateRangePicker value={dateRange} onChange={onDateChange} />
    </div>
  )
}
```

- [ ] **Step 4: Criar `origem-vendas-table.tsx`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-vendas/_components/origem-vendas-table.tsx
import { cn } from '@/lib/utils'
import type { OrigemVendaRow } from '../queries'

function brl(v: number): string {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(1)}k`
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

interface Props {
  rows: OrigemVendaRow[]
}

export function OrigemVendasTable({ rows }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/10 bg-card">
      <table className="w-full">
        <thead>
          <tr className="border-b border-primary/10 bg-foreground/2">
            {['Origem', 'Propostas aprovadas', 'Volume contratado', 'Comissão gerada'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-widest text-foreground/40">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-foreground/38">Nenhum dado encontrado.</td></tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.origem} className="hover:bg-foreground/2">
              <td className={cn('p-4 text-sm font-medium', i < rows.length - 1 && 'border-b border-primary/8')}>{r.origem}</td>
              <td className={cn('p-4 text-sm', i < rows.length - 1 && 'border-b border-primary/8')}>{r.propostasAprovadas.toLocaleString('pt-BR')}</td>
              <td className={cn('p-4 text-sm font-semibold', i < rows.length - 1 && 'border-b border-primary/8')}>{brl(r.volumeContratado)}</td>
              <td className={cn('p-4 text-sm text-success font-semibold', i < rows.length - 1 && 'border-b border-primary/8')}>{brl(r.comissaoGerada)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 5: Criar `page.tsx`**

```typescript
// apps/console/src/app/(private)/relatorios/origem-vendas/page.tsx
import type { Metadata } from 'next'
import { Download } from 'lucide-react'

import { OrigemVendasFilters } from './_components/origem-vendas-filters'
import { OrigemVendasKpiCards } from './_components/origem-vendas-kpi-cards'
import { OrigemVendasTable } from './_components/origem-vendas-table'
import { getOrigemVendasKpis, listOrigemVendas, type OrigemVendasFilters as Filters } from './queries'

export const metadata: Metadata = { title: 'Origem de Vendas' }

interface Props {
  searchParams: Promise<{ de?: string; ate?: string }>
}

export default async function OrigemVendasPage({ searchParams }: Props) {
  const params = await searchParams
  const filters: Filters = { de: params.de, ate: params.ate }

  const [rows, kpis] = await Promise.all([
    listOrigemVendas(filters),
    getOrigemVendasKpis(filters),
  ])

  const csvParams = new URLSearchParams(
    Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined)) as Record<string, string>
  )

  return (
    <div className="mx-auto max-w-10/12 w-full p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-6">
        <div>
          <span className="text-xs font-medium uppercase tracking-widest text-foreground/45">Relatórios · Vendas</span>
          <h1 className="mb-2 mt-1 text-4xl font-semibold leading-none tracking-tight text-foreground">
            Origem de Vendas<span className="text-primary">.</span>
          </h1>
          <p className="m-0 max-w-xl text-sm leading-normal text-foreground/55">
            Propostas aprovadas por origem — loja própria vs. vendedores cadastrados, com comissão gerada.
          </p>
        </div>
        <a
          href={`/api/export/relatorios/origem-vendas?${csvParams.toString()}`}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-primary/16 bg-foreground/4 px-4 py-2.5 text-sm font-medium text-foreground no-underline"
        >
          <Download size={14} /> Exportar CSV
        </a>
      </div>

      <OrigemVendasKpiCards
        totalAprovadas={kpis.totalAprovadas}
        lojaPropriaAprovadas={kpis.lojaPropriaAprovadas}
        vendedoresAprovadas={kpis.vendedoresAprovadas}
      />

      <div className="mt-4"><OrigemVendasFilters /></div>
      <div className="mt-3.5"><OrigemVendasTable rows={rows} /></div>
    </div>
  )
}
```

- [ ] **Step 6: Criar Route Handler de CSV**

```typescript
// apps/console/src/app/api/export/relatorios/origem-vendas/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import { listOrigemVendas } from '@/app/(private)/relatorios/origem-vendas/queries'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const rows = await listOrigemVendas({
    de: searchParams.get('de') ?? undefined,
    ate: searchParams.get('ate') ?? undefined,
  })

  const header = 'Origem,Propostas aprovadas,Volume contratado (R$),Comissão gerada (R$)\n'
  const body = rows
    .map((r) => `"${r.origem}",${r.propostasAprovadas},${r.volumeContratado},${r.comissaoGerada}`)
    .join('\n')

  return new NextResponse(header + body, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="origem-vendas.csv"',
    },
  })
}
```

- [ ] **Step 7: Verificar build e commitar**

```bash
pnpm --filter console build 2>&1 | tail -20
git add apps/console/src/app/\(private\)/relatorios/origem-vendas/ apps/console/src/app/api/export/relatorios/origem-vendas/
git commit -m "feat(console/relatorios): página Origem de Vendas com exportação CSV"
```

---

## Task 19: Verificação final

- [ ] **Step 1: Build completo**

```bash
pnpm --filter console build 2>&1 | tail -30
```

Resultado esperado: 0 erros de TypeScript, 0 erros de build.

- [ ] **Step 2: Checar rotas registradas**

```bash
pnpm --filter console exec next info 2>/dev/null | grep -E "clients|financeiro|relatorios" || echo "verificar manualmente no .next/"
```

- [ ] **Step 3: Verificar importações de DateRangePicker**

```bash
grep -r "date-range-picker" apps/console/src --include="*.tsx" --include="*.ts"
```

Todos os imports devem apontar para `@/components/date-range-picker` — nenhum para `proposals/_components/`.

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore(console): verificação final de build e imports"
```

---

## Notas Importantes

**`proposals.simulation_id`:** A Task 4 assume que `proposals` tem uma FK para `simulations`. Se a coluna for `simulation_id` no schema real, usar diretamente. Se o relacionamento for invertido (`simulations` tem um campo ligando à proposal), ajustar a query de funil conforme o schema real em `packages/database/src/types.ts`.

**`seller_id` como NULL:** Até que a spec do Sales Team seja implementada e vendedores sejam convidados, `seller_id` é sempre `NULL` em produção — todos os leads aparecerão como "Loja própria". Isso é o comportamento correto.

**`commission_snapshots` e `paid_at`:** O campo `paid_at` é atualizável apenas pelo backoffice (via RLS). O console exibe `paid_at IS NULL` como "A receber" e `paid_at IS NOT NULL` como "Pago". O admin deve implementar a UI de marcação de pagamento separadamente.

**Ordem de execução recomendada:** Tasks 1 e 2 (migrations) → Task 3 (DateRangePicker) → Tasks 4–7 (Dashboard) → Tasks 8–12 (Clientes) → Task 13 (Sidebar) → Tasks 14–16 (Financeiro) → Tasks 17–18 (Relatórios) → Task 19 (verificação).

# Sprint 1 — Setup + Vello Admin (Módulo Admin MVP)

**Objetivo:** Projeto estruturado no monorepo existente + módulo Admin funcionando em staging.
**Estimativa:** 2 semanas · **Status:** 🔴 Não iniciado

---

## Fase 0 — Estruturar o Monorepo Existente

> Você já tem o boilerplate Turborepo com `packages/auth`, `packages/env` e `packages/transactional`.
> Esta fase adiciona os apps e os packages novos sem quebrar o que existe.

### 0.1 Criar os apps Next.js
```bash
# Na raiz do monorepo
cd apps
npx create-next-app@latest admin --typescript --tailwind --app --skip-install
npx create-next-app@latest console --typescript --tailwind --app --skip-install
npx create-next-app@latest store --typescript --tailwind --app --skip-install
pnpm install
```

- [ ] `apps/admin` criado e rodando em `localhost:3000`
- [ ] `apps/console` criado e rodando em `localhost:3001`
- [ ] `apps/store` criado e rodando em `localhost:3002`
- [ ] Portas configuradas nos `package.json` de cada app (`"dev": "next dev --port 300X"`)

### 0.2 Instalar shadcn em cada app
```bash
cd apps/admin && npx shadcn@latest init
cd ../console && npx shadcn@latest init
cd ../store && npx shadcn@latest init
```
- [ ] shadcn configurado nos 3 apps com tema padrão

### 0.3 Instalar dependências do Supabase em cada app
```bash
# Em cada app (admin, console, store)
pnpm add @supabase/ssr @supabase/supabase-js
```
- [ ] Dependências instaladas nos 3 apps

### 0.4 Criar `packages/database`
```
packages/database/
├── package.json       ← name: "@vello/database"
├── src/
│   ├── index.ts       ← re-exporta types e helpers
│   ├── types.ts       ← gerado pelo Supabase CLI (não editar manualmente)
│   └── helpers/
│       └── index.ts   ← placeholder para queries reutilizáveis
└── tsconfig.json      ← estende o tsconfig base do monorepo
```
- [ ] Package criado e referenciado nos 3 apps como `"@vello/database": "workspace:*"`

### 0.5 Criar `packages/config` (Tailwind base)
```
packages/config/
├── package.json        ← name: "@vello/config"
├── tailwind.base.ts    ← config base compartilhada
└── tsconfig.json
```
- [ ] Cada app estende o base no seu `tailwind.config.ts`

### 0.6 Expandir `packages/env` com schemas dos novos apps
- [ ] Criar `packages/env/src/admin.ts` com variáveis do Vello Admin
- [ ] Criar `packages/env/src/console.ts` com variáveis do Vello Console
- [ ] Criar `packages/env/src/store.ts` com variáveis do Vello Store
- [ ] Criar `.env.example` em cada app

### 0.7 Expandir `packages/auth` com roles da Vello
- [ ] Adicionar tipos `BackofficeRole`, `TenantRole`, `SystemRole`, `JwtClaims`
- [ ] Exportar helpers de verificação de permissão por módulo

### 0.8 Atualizar `turbo.json`
- [ ] Adicionar task `db:types` para regenerar types do Supabase
- [ ] Confirmar que `build`, `dev`, `lint`, `type-check` funcionam para os novos apps

### 0.9 Supabase CLI
```bash
brew install supabase/tap/supabase
supabase login
supabase link --project-ref SEU_PROJECT_REF_STAGING
```
- [ ] CLI instalado e linkado ao projeto staging
- [ ] `supabase/migrations/` criado na raiz

### 0.10 Copiar docs de spec para o repositório
- [ ] Pasta `docs/` copiada para a raiz do monorepo
- [ ] `CLAUDE.md` copiado para a raiz do monorepo

---

## Fase 1 — Supabase: Clients e Auth no Admin

- [ ] Criar `apps/admin/lib/supabase/client.ts` (browser client)
- [ ] Criar `apps/admin/lib/supabase/server.ts` (server client para RSC e Actions)
- [ ] Criar `apps/admin/middleware.ts` (proteção de rotas + refresh de sessão)
- [ ] Criar migration: `20260401000000_enable_moddatetime.sql`
  ```sql
  CREATE EXTENSION IF NOT EXISTS moddatetime;
  ```
- [ ] Criar migration: `20260401000001_create_backoffice_users.sql`
  - Tabela de perfis internos com roles (`super_admin`, `admin`, `financial`, `support`)
  - Hook de Auth para injetar `role` e `tenant_id: null` no JWT
- [ ] Criar página de login: `apps/admin/app/(auth)/login/page.tsx`
- [ ] Layout do backoffice com sidebar: `apps/admin/app/(app)/layout.tsx`
  - Itens: Dashboard · Parceiros · Produtos · Planos · Tenants
- [ ] Seed: criar usuário super_admin inicial em `supabase/seed.sql`
- [ ] **Teste:** login → redirect para dashboard → logout → redirect para login

---

## Fase 2 — Correspondentes Bancários

> Pré-requisito de Produtos. CRUD simples.

- [ ] Migration: `20260401100000_create_financial_partners.sql`
- [ ] RLS: apenas backoffice acessa
- [ ] `/financial-partners` — listagem
- [ ] `/financial-partners/new` — criar
- [ ] `/financial-partners/[id]/edit` — editar
- [ ] Toggle ativo/inativo com modal de confirmação
- [ ] Mascarar `api_key_enc` e `webhook_secret` na exibição (apenas `super_admin` vê)
- [ ] Seed: criar parceiro "Qi Tech" para testes

---

## Fase 3 — Produtos de Crédito

> Spec: `docs/features/admin/products/SPEC.md`

- [ ] Migration: `20260401110000_create_products.sql`
- [ ] RLS: backoffice full access · tenants SELECT apenas produtos ativos
- [ ] Componente `<CommissionCascade />` com preview em tempo real
- [ ] `/products` — F1 listagem
- [ ] `/products/new` — F2 criar (com cascata interativa)
- [ ] `/products/[id]/edit` — F3 editar
- [ ] F4 desativar (modal com contagem de tenants impactados)
- [ ] `/products/[id]` — F5 detalhes
- [ ] Seed: produto FGTS (10% banco / 5% Vello) e Consignado Público (8% banco / 4% Vello)
- [ ] **Teste:** criar FGTS → disponível ao tenant = 5% ✓

---

## Fase 4 — Planos de Assinatura

> Spec: `docs/features/admin/plans/SPEC.md`

- [ ] Migration: `20260401120000_create_plans.sql`
- [ ] RLS: backoffice full · tenants SELECT plano próprio
- [ ] `/plans` — F1 listagem
- [ ] `/plans/new` — F2 criar
- [ ] `/plans/[id]/edit` — F3 editar (Tipo read-only)
- [ ] F4 desativar/reativar
- [ ] `/plans/[id]` — F5 detalhes com lista de tenants
- [ ] Seed: plano "White-Label Starter" (3,5% comissão) e "White-Label Premium" (4% comissão)

---

## Fase 5 — Tenants White-Label

> Spec: `docs/features/admin/tenants/SPEC.md`

- [ ] Migration: `20260401130000_create_tenants.sql`
- [ ] Migration: `20260401140000_create_tenant_products.sql`
- [ ] RLS: backoffice full · tenant SELECT apenas a si mesmo
- [ ] `/tenants` — F1 listagem
- [ ] `/tenants/new` — F2 criar (com auto-geração de slug e preview de URL)
- [ ] F3 ativar (cria usuário Supabase Auth + dispara `TenantWelcomeEmail` via `packages/transactional`)
- [ ] `/tenants/[id]/edit` — F4 editar
- [ ] F5 suspender/cancelar/reativar (com modais de confirmação)
- [ ] `/tenants/[id]/products` — F6 gerenciar produtos (toggle + edição de comissão)
- [ ] `/tenants/[id]` — F7 detalhes
- [ ] **Testes:**
  - [ ] Criar tenant → ativar → usuário criado no Supabase Auth ✓
  - [ ] Habilitar FGTS com 3,5% → tenant_products registrado ✓
  - [ ] Suspender → tenant não consegue logar ✓

---

## Fase 6 — Snapshots de Comissão

> Spec: `docs/features/admin/commissions/SPEC.md`

- [ ] Migration: `20260401150000_create_commission_snapshots.sql`
- [ ] Migration: `20260401160000_create_commission_trigger.sql` (trigger + function)
- [ ] RLS: backoffice full · tenants SELECT snapshots dos seus próprios proposals · sem UPDATE · sem DELETE
- [ ] Componente `<CommissionSnapshotPanel />` em `apps/admin/components/commissions/`
- [ ] **Testes:**
  - [ ] Criar proposta (mock) → snapshot gerado automaticamente ✓
  - [ ] Alterar comissão do produto → snapshot da proposta antiga preservado ✓
  - [ ] Tentar UPDATE em `commission_snapshots` → erro ✓

---

## Fase 7 — GitHub Actions + Vercel

- [ ] Criar 3 projetos na Vercel (`vello-admin`, `vello-console`, `vello-store`)
  - Cada um com Root Directory apontando para `apps/admin`, `apps/console`, `apps/store`
- [ ] `.github/workflows/deploy-admin.yml` com path filter `apps/admin/**` e `packages/**`
- [ ] `.github/workflows/deploy-console.yml` com path filter `apps/console/**` e `packages/**`
- [ ] `.github/workflows/deploy-store.yml` com path filter `apps/store/**` e `packages/**`
- [ ] `.github/workflows/migrate-staging.yml` para migrations automáticas no staging
- [ ] Configurar todos os secrets no GitHub (ver `docs/architecture/cicd.md`)
- [ ] **Teste:** push em `apps/admin/` → apenas o admin redeploya ✓

---

## Critérios de Conclusão da Sprint

- [ ] Todos os módulos (parceiros, produtos, planos, tenants, snapshots) funcionando em staging
- [ ] Auth do backoffice com roles funcionando
- [ ] RLS testado: usuário tenant não vê dados de outro tenant
- [ ] Seed populado com dados realistas para demo
- [ ] Deploy em produção: `admin.vellofinance.com.br`
- [ ] CI/CD configurado com path filters
- [ ] `CLAUDE.md` atualizado com decisões tomadas durante o desenvolvimento

---

## Comandos de referência

```bash
# Dev
pnpm dev --filter=admin

# Migrations
supabase db push --linked

# Regenerar types (rodar após toda migration)
pnpm db:types

# Reset local (cuidado!)
supabase db reset

# Build completo
pnpm build
```

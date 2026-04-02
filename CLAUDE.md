# Vello Finance — Instruções para o Claude Code

## O que é este projeto

**Vello Finance** é uma plataforma SaaS multi-tenant para venda de crédito e empréstimos.
Consultores e white-labels operam suas próprias lojas com comissões automatizadas.

## Leia antes de qualquer tarefa

1. Identifique o app afetado (`admin`, `console`, `store`, `api`)
2. Leia a spec da feature em `docs/features/`
3. Leia a arquitetura relevante em `docs/architecture/`
4. Consulte as convenções em `docs/architecture/conventions.md`
5. Confirme o modelo de dados antes de criar migrations

## Estrutura do Monorepo

```
vello-finance/
├── apps/
│   ├── admin/src/          ← Vello Admin — backoffice interno (Next.js, usa src/)
│   ├── console/src/        ← Vello Console — painel do tenant (Next.js, usa src/)
│   ├── store/src/          ← Vello Store — loja pública e white-label (Next.js, usa src/)
│   └── api/                ← Serviços Python — CNAB, integrações bancárias (FastAPI)
├── packages/
│   ├── auth/               ← RBAC: roles e permissões (já existe — expandido)
│   ├── env/                ← Variáveis de ambiente validadas com Zod/t3-env (já existe)
│   ├── transactional/      ← Templates de email para Resend (já existe)
│   ├── database/           ← Types gerados pelo Supabase CLI + helpers de query
│   └── config/             ← Tailwind base compartilhado entre os 3 apps Next.js (já existe — expandido)
├── supabase/
│   └── migrations/         ← SQL migrations versionadas (únicas, afetam todos os apps)
├── turbo.json
└── CLAUDE.md               ← Este arquivo
```

## Apps em detalhe

### `apps/admin` — Vello Admin
- **Audiência:** Equipe interna da Vello Finance
- **URL Produção:** `admin.vellofinance.com.br`
- **URL Staging:** `admin.staging.vellofinance.com.br`
- **Acesso:** Restrito por IP allowlist + MFA obrigatório
- **Módulos:** Planos, Tenants, Produtos, Comissões, Pipeline global, Financeiro, Relatórios

### `apps/console` — Vello Console
- **Audiência:** Consultores assinantes (tenants)
- **URL Produção:** `[slug].vellofinance.com.br` ou domínio próprio (white-label)
- **URL Staging:** `[slug].staging.vellofinance.com.br`
- **Acesso:** Autenticado por tenant (RLS garante isolamento total entre tenants)
- **Módulos:** Dashboard, Pipeline de propostas, CRM, Configurações da loja, Financeiro

### `apps/store` — Vello Store
- **Audiência:** Cliente final (tomador de crédito)
- **URL Produção:** Servida dentro do domínio do tenant (mesmo app, contexto diferente)
- **Acesso:** Público — sem autenticação para simular, OTP para solicitar proposta
- **Módulos:** Simulador, Formulário de proposta, Acompanhamento de proposta

### `apps/api` — Serviços Python
- **Tecnologia:** Python 3.12 + FastAPI
- **Deploy:** Railway
- **Responsabilidades:** Geração de CNAB 240, processamento de documentos, integrações complexas

## Packages em detalhe

### `packages/auth` (já existe — expandir)
Roles e permissões RBAC usadas pelos 3 apps Next.js.

```typescript
// Roles do backoffice (Vello Admin)
export type BackofficeRole = 'super_admin' | 'admin' | 'financial' | 'support'

// Roles dos tenants (Vello Console)
export type TenantRole = 'tenant_admin' | 'tenant_operator'

export type SystemRole = BackofficeRole | TenantRole

// Claims JWT injetados pelo Supabase Auth Hook
export type JwtClaims = {
  role: SystemRole
  tenant_id: string | null  // null = usuário do backoffice
}
```

### `packages/env` (já existe — expandir)
Schemas Zod para variáveis de ambiente. Cada app importa apenas seu schema:

```
packages/env/src/
├── admin.ts        → usado exclusivamente em apps/admin
├── console.ts      → usado exclusivamente em apps/console
├── store.ts        → usado exclusivamente em apps/store
└── shared.ts       → variáveis comuns (SUPABASE_URL, etc.)
```

### `packages/transactional` (já existe — expandir)
Templates React Email para Resend. Emails disparados pela plataforma:
- `TenantWelcomeEmail` — boas-vindas ao ativar um tenant (Admin)
- `ProposalReceivedEmail` — confirmação de proposta para o cliente (Store)
- `ProposalStatusEmail` — atualização de status da proposta (Console → cliente)
- `CommissionPaidEmail` — notificação de repasse ao tenant (Admin → tenant)

### `packages/database` (novo)
Types gerados pelo Supabase CLI + helpers reutilizáveis entre apps.

```
packages/database/src/
├── types.ts         ← gerado automaticamente (nunca editar manualmente)
└── helpers/
    ├── proposals.ts  ← queries reutilizáveis de propostas
    └── tenants.ts    ← queries reutilizáveis de tenants
```

Regenerar após migrations: `pnpm db:types` (definido no turbo.json)

### `packages/config` (novo)
Tailwind base compartilhado. Cada app estende e adiciona tokens próprios.

```javascript
// packages/config/tailwind.base.ts
// apps/admin/tailwind.config.ts → extends base, adiciona cores do admin
// apps/console/tailwind.config.ts → extends base, usa cores do tenant em runtime
// apps/store/tailwind.config.ts → extends base, cores dinamicas via CSS vars
```

## Stack completa

| Camada | Tecnologia |
|---|---|
| Frontend (3 apps) | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend / BaaS | Supabase (PostgreSQL + Auth + Storage + Edge Functions + Realtime) |
| Automações | N8N self-hosted (Railway) |
| Serviços auxiliares | Python 3.12 + FastAPI (Railway) |
| Emails | Resend + React Email (`packages/transactional`) |
| Deploy frontend | Vercel — 3 projetos distintos, mesmo repositório |
| Deploy API + N8N | Railway |

## Regras obrigatórias

- **Nunca escrever código sem spec aprovada** em `docs/features/`
- **Toda tabela com dados de tenant deve ter `tenant_id`** com RLS policy correspondente
- **Snapshots de comissão são imutáveis** — ver `docs/features/admin/commissions/SPEC.md`
- **Migrations são compartilhadas** — `supabase db push` afeta todos os apps
- **Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no cliente** — apenas Server Actions e Edge Functions
- **Regenerar types** após toda nova migration: `pnpm db:types`
- **Commits:** `feat(admin): descrição` | `fix(console): descrição` | `chore(packages/auth): descrição`

## Arquitetura: Fat Server, Thin Client

### Regra central
O browser NUNCA fala diretamente com o Supabase.
Toda chamada ao banco é feita no servidor (Server Components, Server Actions, Route Handlers).

### O que isso significa na prática

**✅ CORRETO — dados buscados no servidor:**
```tsx
// app/(app)/plans/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('plans').select('*')
  return <PlanTable plans={data} />
}
```

**❌ ERRADO — dados buscados no cliente:**
```tsx
'use client'
import { createClient } from '@/lib/supabase/client' // NUNCA em páginas de dados

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  useEffect(() => {
    createClient().from('plans').select('*').then(...) // PROIBIDO
  }, [])
}
```

**✅ CORRETO — mutação via Server Action:**
```tsx
// app/(app)/plans/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createPlan(formData: FormData) {
  const supabase = await createClient() // server client — não exposto
  await supabase.from('plans').insert(...)
}
```

**❌ ERRADO — mutação via fetch do cliente:**
```tsx
'use client'
// NUNCA chamar supabase.from() direto no client component para mutações
```

### Quando `supabase/client.ts` pode ser usado

Apenas para estes casos específicos, sem acesso ao banco:
- `supabase.auth.getUser()` — verificar sessão ativa no cliente
- `supabase.auth.signOut()` — logout
- Subscriptions de Realtime (quando notificações em tempo real forem necessárias — documentar explicitamente)

### Fluxo de dados obrigatório
```
Browser                    Servidor (Next.js)           Supabase
  │                               │                         │
  │── clica em "Salvar" ─────────▶│                         │
  │                        Server Action                    │
  │                               │── INSERT/SELECT ───────▶│
  │                               │◀── resultado ───────────│
  │◀── redirect ou toast ─────────│                         │
```

### Verificação antes de criar qualquer arquivo

Antes de escrever código que acessa dados, pergunte:
1. Este arquivo tem `'use client'`? → NÃO pode importar `supabase/server` nem fazer queries
2. Este arquivo é Server Component ou tem `'use server'`? → PODE fazer queries
3. Preciso de dado no cliente? → receba via props do Server Component pai

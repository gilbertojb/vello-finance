# Convenções do Projeto — Vello Finance

## Estrutura de Pastas por App (Next.js 15 App Router)

Todos os 3 apps Next.js (`admin`, `console`, `store`) seguem a mesma estrutura interna:

```
apps/[admin|console|store]/
├── app/
│   ├── layout.tsx              ← Layout raiz do app
│   ├── page.tsx                ← Página inicial (redirect para dashboard ou simulador)
│   ├── (auth)/                 ← Route group: rotas de autenticação
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (app)/                  ← Route group: rotas autenticadas
│   │   ├── layout.tsx          ← Layout com sidebar/navbar
│   │   └── [módulos]/          ← Ex: plans/, tenants/, products/
│   └── api/                    ← Route Handlers (quando Edge Function não basta)
├── components/
│   ├── ui/                     ← shadcn/ui (gerado pelo CLI — não editar)
│   └── [módulo]/               ← Componentes específicos do módulo
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← Supabase browser client (Client Components)
│   │   └── server.ts           ← Supabase server client (Server Components + Actions)
│   └── utils.ts
├── middleware.ts                ← Auth + resolução de tenant (console e store)
├── tailwind.config.ts          ← Estende packages/config/tailwind.base.ts
└── .env.local                  ← Variáveis validadas via packages/env
```

## Estrutura de Módulo (padrão para todos os apps)

```
app/(app)/plans/
├── page.tsx                    ← Server Component — listagem
├── new/
│   └── page.tsx                ← Server Component — formulário de criação
├── [id]/
│   ├── page.tsx                ← Server Component — detalhes
│   └── edit/
│       └── page.tsx            ← Server Component — formulário de edição
├── actions.ts                  ← Server Actions (create, update, delete, toggle)
├── queries.ts                  ← Funções de query ao Supabase (reutilizáveis)
└── _components/                ← Client Components do módulo (prefixo _ = privado)
    ├── PlanTable.tsx
    ├── PlanForm.tsx
    └── PlanStatusBadge.tsx
```

## Nomenclatura

| Item | Convenção | Exemplo |
|---|---|---|
| Apps | kebab-case | `admin`, `console`, `store` |
| Packages | kebab-case | `auth`, `database`, `transactional` |
| Componentes | PascalCase | `ProposalCard.tsx` |
| Server Actions | camelCase com verbo | `createTenant`, `updateProduct` |
| Queries | camelCase com `get`/`list` | `getTenant`, `listProducts` |
| Hooks | camelCase com `use` | `useTenant`, `useProposals` |
| Tabelas DB | snake_case plural | `commission_snapshots`, `tenant_products` |
| Colunas DB | snake_case | `tenant_id`, `created_at`, `bank_commission_pct` |
| Enums DB | snake_case | `proposal_status`, `product_type` |
| Migrations | `YYYYMMDDHHMMSS_descricao.sql` | `20260401120000_create_plans.sql` |
| Branches | `feat/`, `fix/`, `chore/` | `feat/admin-products` |
| Commits | Conventional Commits com escopo | `feat(admin): adiciona CRUD de produtos` |

**Escopos válidos nos commits:**
`admin` · `console` · `store` · `api` · `packages/auth` · `packages/database` · `packages/env` · `packages/transactional` · `packages/config` · `supabase`

## Padrão de Server Action

```typescript
// app/(app)/plans/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const planSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['saas', 'whitelabel']),
  monthly_fee: z.number().positive().optional(),
  commission_pct: z.number().min(0.0001).max(100),
})

export async function createPlan(formData: FormData) {
  const supabase = await createClient()

  const parsed = planSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.flatten() }

  const { error } = await supabase.from('plans').insert(parsed.data)
  if (error) return { error: error.message }

  revalidatePath('/plans')
  return { success: true }
}
```

## Padrão de Query reutilizável

```typescript
// app/(app)/plans/queries.ts
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@vello/database'

export async function listPlans(onlyActive = false) {
  const supabase = await createClient()
  let query = supabase.from('plans').select('*').order('name')
  if (onlyActive) query = query.eq('is_active', true)
  const { data, error } = await query
  if (error) throw error
  return data
}
```

## Padrão de Migration (Supabase)

```sql
-- supabase/migrations/20260401120000_create_plans.sql

-- Tabela
CREATE TABLE plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  ...
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- updated_at automático
CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON plans
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenants_read_active" ON plans
  FOR SELECT USING (is_active = true);
```

## Variáveis de Ambiente por App

Cada app importa seu schema de `packages/env`:

```typescript
// apps/admin/env.ts
import { createEnv } from '@vello/env/admin'
export const env = createEnv()

// apps/console/env.ts
import { createEnv } from '@vello/env/console'
export const env = createEnv()
```

Variáveis obrigatórias em todos os apps:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # nunca expor no cliente
```

## Tratamento de Erros

- **Client Components:** `toast` (sonner) para feedback ao usuário
- **Server Actions:** retornar `{ error: string | FieldErrors }` ou `{ success: true, data?: T }`
- **Nunca expor stack traces ao usuário**
- **Erros inesperados:** logar no servidor com contexto (`user_id`, `tenant_id`, `action`)
- **Supabase errors:** tratar o campo `error.code` para mensagens amigáveis (ex: `23505` = duplicado)

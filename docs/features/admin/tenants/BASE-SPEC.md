# Spec de Base — Tenants

**App:** `apps/admin` — Vello Admin
**Status:** `aprovado`
**Escopo:** Fundação para todas as features de tenants — migrations, RLS, TanStack Query, padrão de roles

---

## O que este spec cobre

1. Migrations: `tenants`, `tenant_branding`, `tenant_products`, ajuste de `backoffice_users` RLS
2. TanStack Query: setup com padrão Server Prefetch + Hydration
3. Padrão de RLS: três categorias de tabela, documentadas e aplicadas
4. Padrão de roles: DB ENUM como fonte de verdade, TypeScript espelha os valores

**Fora deste spec:**
- Tabela `tenant_users` e ativação de tenant → F3
- UI de listagem, criação, detalhes, produtos → specs separados

---

## Seção 1 — Migrations

### 1.1 `tenants`

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_tenants.sql

CREATE TYPE tenant_type AS ENUM ('whitelabel', 'subscription');
CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'cancelled');

CREATE TABLE tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID NOT NULL REFERENCES plans(id),
  type           tenant_type NOT NULL,
  name           TEXT NOT NULL,
  company_name   TEXT NOT NULL,
  cnpj           TEXT NOT NULL UNIQUE,
  email          TEXT NOT NULL,
  phone          TEXT,
  slug           TEXT NOT NULL UNIQUE,
  custom_domain  TEXT UNIQUE,
  status         tenant_status NOT NULL DEFAULT 'pending',
  activated_at   TIMESTAMPTZ,
  suspended_at   TIMESTAMPTZ,
  bank_name      TEXT,
  bank_agency    TEXT,
  bank_account   TEXT,
  bank_pix_key   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Categoria A — tabela do backoffice (sem acesso de tenant)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenants
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );
```

### 1.2 `tenant_branding`

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_tenant_branding.sql

CREATE TABLE tenant_branding (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url             TEXT,
  favicon_url          TEXT,
  primary_color        TEXT NOT NULL DEFAULT '#3B5BBE',
  secondary_color      TEXT NOT NULL DEFAULT '#1E3A5F',
  auth_bg_image_url    TEXT,
  auth_bg_color        TEXT NOT NULL DEFAULT '#18181b',
  auth_theme           TEXT NOT NULL DEFAULT 'dark'
                       CHECK (auth_theme IN ('dark', 'light')),
  company_display_name TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cria branding padrão automaticamente ao inserir tenant
CREATE OR REPLACE FUNCTION create_default_branding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_branding (tenant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_branding
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_branding();

CREATE TRIGGER set_updated_at_tenant_branding
  BEFORE UPDATE ON tenant_branding
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Categoria B — isolada por tenant
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenant_branding
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_isolation" ON tenant_branding
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

### 1.3 `tenant_products`

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_tenant_products.sql

CREATE TABLE tenant_products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES products(id),
  tenant_commission_pct NUMERIC(5,4) NOT NULL,
  vello_spread_pct      NUMERIC(5,4) NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, product_id)
);

CREATE TRIGGER set_updated_at_tenant_products
  BEFORE UPDATE ON tenant_products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Categoria B — isolada por tenant
ALTER TABLE tenant_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenant_products
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_isolation" ON tenant_products
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

### 1.4 Ajuste RLS `backoffice_users`

A policy atual (`backoffice_users_super_admin`) dá acesso total apenas ao `super_admin`.
O padrão documentado exige separação entre leitura (todos os roles internos) e escrita (apenas `super_admin`).

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_fix_backoffice_users_rls.sql

-- Remove policies antigas
DROP POLICY IF EXISTS "backoffice_users_self_read" ON backoffice_users;
DROP POLICY IF EXISTS "backoffice_users_super_admin" ON backoffice_users;

-- Todos os roles do backoffice podem ler (necessário para listagem de membros da equipe)
CREATE POLICY "backoffice_full_read" ON backoffice_users
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Apenas super_admin pode criar, editar e remover membros
CREATE POLICY "super_admin_write" ON backoffice_users
  FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'super_admin'
  );
```

> **Nota:** A policy `backoffice_users_self_read` (que permitia leitura pelo `auth.uid()`) foi removida intencionalmente. Usuários do backoffice são criados pelo `super_admin` via service client — nunca se auto-registram. Ao fazer login, o Auth Hook já injeta o `role` no JWT, portanto `backoffice_full_read` cobre todos os casos de leitura legítima.

---

## Seção 2 — TanStack Query Setup

### Padrão: Server Prefetch + Hydration

O browser nunca acessa o Supabase diretamente. O Server Component prefetch os dados,
hidrata o cache do TanStack Query e o Client Component lê do cache.

```
page.tsx (Server Component)
  └── getQueryClient()
  └── queryClient.prefetchQuery({ queryKey, queryFn })   ← Supabase no servidor
  └── <HydrationBoundary state={dehydrate(queryClient)}>
        └── <TenantTable />                              ← Client Component
              └── useSuspenseQuery(queryKey)             ← lê do cache, sem fetch no browser
```

### Arquivos

**`src/lib/query-client.ts`** — singleton server-side por request:

```typescript
import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

export const getQueryClient = cache(() => new QueryClient())
```

**`src/lib/query-keys.ts`** — objeto centralizado de query keys:

```typescript
export const queryKeys = {
  tenants: {
    all: ['tenants'] as const,
    list: (filters?: Record<string, unknown>) =>
      [...queryKeys.tenants.all, 'list', filters] as const,
    detail: (id: string) =>
      [...queryKeys.tenants.all, 'detail', id] as const,
  },
  plans: {
    all: ['plans'] as const,
    list: () => [...queryKeys.plans.all, 'list'] as const,
  },
} as const
```

**`src/app/providers.tsx`** — adiciona `QueryClientProvider` e devtools:

```tsx
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Dependências

Adicionar em `apps/admin/package.json`:

```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0"
}
```

Rodar `pnpm install` após adicionar.

---

## Seção 3 — Padrão de RLS

### Três categorias

**Categoria A — Tabelas do backoffice** (sem acesso de tenant)

Usada em: `backoffice_users`, `plans`, `products`, `financial_partners`

```sql
ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON [tabela]
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );
```

> Variação: quando `super_admin` deve ser o único a escrever, usar `backoffice_full_read` + `super_admin_write` separados (ver `backoffice_users`).

**Categoria B — Tabelas isoladas por tenant**

Usada em: `tenant_products`, `tenant_branding`, `proposals`, `clients`

```sql
ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;

-- Backoffice lê e escreve tudo
CREATE POLICY "backoffice_full_access" ON [tabela]
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Tenant vê apenas seus próprios dados
CREATE POLICY "tenant_isolation" ON [tabela]
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

**Categoria C — Tabelas globais lidas por tenants**

Usada em: `plans`, `products` (quando tenants precisam ler)

```sql
ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;

-- Backoffice gerencia tudo
CREATE POLICY "backoffice_full_access" ON [tabela]
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Tenants leem apenas registros ativos
CREATE POLICY "tenant_read_active" ON [tabela]
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );
```

### Checklist ao criar uma nova tabela

- [ ] Determinar categoria (A, B ou C)
- [ ] `ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY`
- [ ] Aplicar as policies da categoria correspondente
- [ ] Se Categoria B: garantir que a tabela tem `tenant_id UUID NOT NULL REFERENCES tenants(id)`

---

## Seção 4 — Padrão de Roles (DB ENUM ↔ `@vello/auth`)

### Regra

O PostgreSQL ENUM é a **fonte de verdade**. O pacote `@vello/auth` espelha os valores exatos.
Ao adicionar um novo role: criar migration com `ALTER TYPE` primeiro, depois atualizar `@vello/auth`.

### Mapeamento

| PostgreSQL ENUM | Valores | TypeScript (`@vello/auth`) |
|---|---|---|
| `backoffice_role` | `super_admin`, `admin`, `financial`, `support` | `BackofficeRole` |
| `tenant_role` *(F3)* | `tenant_admin`, `tenant_operator` | `TenantRole` |
| `tenant_type` | `whitelabel`, `subscription` | *(apenas DB — sem tipo no pacote)* |
| `tenant_status` | `pending`, `active`, `suspended`, `cancelled` | *(apenas DB — sem tipo no pacote)* |

### Checklist ao adicionar role novo

- [ ] `ALTER TYPE [enum_name] ADD VALUE 'novo_role'` na migration
- [ ] Atualizar `z.union([...z.literal('novo_role')])` em `packages/auth/src/vello-roles.ts`
- [ ] Regenerar types: `pnpm db:types`
- [ ] Atualizar policies RLS que usam `ANY(ARRAY[...])` se necessário

---

## Pré-requisito

A tabela `tenants` referencia `plans(id)`. A migration de `plans` deve ser aplicada **antes** das migrations deste spec.
A migration de `plans` está definida no `docs/features/admin/plans/SPEC.md` e deve ser criada separadamente caso ainda não exista.

---

## Arquivos a Criar / Modificar

```
supabase/migrations/
├── YYYYMMDDHHMMSS_create_tenants.sql
├── YYYYMMDDHHMMSS_create_tenant_branding.sql
├── YYYYMMDDHHMMSS_create_tenant_products.sql
└── YYYYMMDDHHMMSS_fix_backoffice_users_rls.sql

apps/admin/
├── package.json                          ← adicionar @tanstack/react-query + devtools
└── src/
    ├── app/
    │   └── providers.tsx                 ← adicionar QueryClientProvider
    ├── lib/
    │   ├── query-client.ts               ← CRIAR — getQueryClient() singleton
    │   └── query-keys.ts                 ← CRIAR — objeto centralizado de query keys

docs/architecture/
└── conventions.md                        ← adicionar seções de RLS e roles
```

---

## Critérios de Aceite

- [ ] 4 migrations aplicadas sem erro via `supabase db push`
- [ ] Types regenerados via `pnpm db:types` refletem as novas tabelas
- [ ] `@tanstack/react-query` instalado e `QueryClientProvider` em `providers.tsx`
- [ ] `getQueryClient()` e `queryKeys` disponíveis em `src/lib/`
- [ ] `backoffice_users` com RLS ajustado (leitura para todos os roles, escrita apenas `super_admin`)
- [ ] `docs/architecture/conventions.md` atualizado com padrão de RLS e roles

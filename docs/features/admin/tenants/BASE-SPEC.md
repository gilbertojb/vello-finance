# Base Spec — Tenants

**App:** `apps/admin` — Vello Admin
**Status:** `approved`
**Scope:** Foundation for all tenant features — migrations, RLS, TanStack Query, role pattern

---

## What this spec covers

1. Migrations: `tenants`, `tenant_branding`, `tenant_products`, adjustment of `backoffice_users` RLS
2. TanStack Query: setup with the Server Prefetch + Hydration pattern
3. RLS pattern: three table categories, documented and applied
4. Role pattern: DB ENUM as the source of truth, TypeScript mirrors the values

**Out of scope for this spec:**
- `tenant_users` table → created alongside the console (`docs/superpowers/specs/2026-04-09-console-app-design.md`, Section 6)
- Tenant activation (F3) depends on `tenant_users` existing → see prerequisite in SPEC.md
- Listing, creation, details, products UI → separate specs

---

## Section 1 — Migrations

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

-- RLS: Category A — backoffice table (no tenant access)
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

-- Automatically creates default branding when a tenant is inserted
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

-- RLS: Category B — isolated per tenant
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

-- RLS: Category B — isolated per tenant
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

### 1.4 `backoffice_users` RLS adjustment

The current policy (`backoffice_users_super_admin`) grants full access only to `super_admin`.
The documented pattern requires separating read access (all internal roles) from write access (`super_admin` only).

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_fix_backoffice_users_rls.sql

-- Remove old policies
DROP POLICY IF EXISTS "backoffice_users_self_read" ON backoffice_users;
DROP POLICY IF EXISTS "backoffice_users_super_admin" ON backoffice_users;

-- All backoffice roles can read (needed for team member listing)
CREATE POLICY "backoffice_full_read" ON backoffice_users
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Only super_admin can create, edit, and remove members
CREATE POLICY "super_admin_write" ON backoffice_users
  FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'super_admin'
  );
```

> **Note:** The `backoffice_users_self_read` policy (which allowed reads via `auth.uid()`) was intentionally removed. Backoffice users are created by `super_admin` via the service client — they never self-register. On login, the Auth Hook already injects the `role` into the JWT, so `backoffice_full_read` covers all legitimate read cases.

---

## Section 2 — TanStack Query Setup

### Pattern: Server Prefetch + Hydration

The browser never accesses Supabase directly. The Server Component prefetches the data,
hydrates the TanStack Query cache, and the Client Component reads from the cache.

```
page.tsx (Server Component)
  └── getQueryClient()
  └── queryClient.prefetchQuery({ queryKey, queryFn })   ← Supabase on the server
  └── <HydrationBoundary state={dehydrate(queryClient)}>
        └── <TenantTable />                              ← Client Component
              └── useSuspenseQuery(queryKey)             ← reads from cache, no fetch in the browser
```

### Files

**`src/lib/query-client.ts`** — server-side singleton per request:

```typescript
import { QueryClient } from '@tanstack/react-query'
import { cache } from 'react'

export const getQueryClient = cache(() => new QueryClient())
```

**`src/lib/query-keys.ts`** — centralized query keys object:

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

**`src/app/providers.tsx`** — adds `QueryClientProvider` and devtools:

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
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Dependencies

Add to `apps/admin/package.json`:

```json
{
  "@tanstack/react-query": "^5.0.0",
  "@tanstack/react-query-devtools": "^5.0.0"
}
```

Run `pnpm install` after adding.

---

## Section 3 — RLS Pattern

### Three categories

**Category A — Backoffice tables** (no tenant access)

Used in: `backoffice_users`, `plans`, `products`, `financial_partners`

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON [table]
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );
```

> Variation: when only `super_admin` should be able to write, use separate `backoffice_full_read` + `super_admin_write` policies (see `backoffice_users`).

**Category B — Tables isolated per tenant**

Used in: `tenant_products`, `tenant_branding`, `proposals`, `clients`

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

-- Backoffice reads and writes everything
CREATE POLICY "backoffice_full_access" ON [table]
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Tenant sees only its own data
CREATE POLICY "tenant_isolation" ON [table]
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

**Category C — Global tables read by tenants**

Used in: `plans`, `products` (when tenants need to read them)

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

-- Backoffice manages everything
CREATE POLICY "backoffice_full_access" ON [table]
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Tenants read only active records
CREATE POLICY "tenant_read_active" ON [table]
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );
```

### Checklist when creating a new table

- [ ] Determine category (A, B, or C)
- [ ] `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY`
- [ ] Apply the policies for the corresponding category
- [ ] If Category B: ensure the table has `tenant_id UUID NOT NULL REFERENCES tenants(id)`

---

## Section 4 — Role Pattern (DB ENUM ↔ `@vello/auth`)

### Rule

The PostgreSQL ENUM is the **source of truth**. The `@vello/auth` package mirrors the exact values.
When adding a new role: create the migration with `ALTER TYPE` first, then update `@vello/auth`.

### Mapping

| PostgreSQL ENUM | Values | TypeScript (`@vello/auth`) |
|---|---|---|
| `backoffice_role` | `super_admin`, `admin`, `financial`, `support` | `BackofficeRole` |
| `tenant_role` *(F3)* | `tenant_admin`, `tenant_operator` | `TenantRole` |
| `tenant_type` | `whitelabel`, `subscription` | *(DB only — no type in the package)* |
| `tenant_status` | `pending`, `active`, `suspended`, `cancelled` | *(DB only — no type in the package)* |

### Checklist when adding a new role

- [ ] `ALTER TYPE [enum_name] ADD VALUE 'new_role'` in the migration
- [ ] Update `z.union([...z.literal('new_role')])` in `packages/auth/src/vello-roles.ts`
- [ ] Regenerate types: `pnpm db:types`
- [ ] Update RLS policies that use `ANY(ARRAY[...])` if needed

---

## Prerequisite

The `tenants` table references `plans(id)`. The `plans` migration must be applied **before** the migrations in this spec.
The `plans` migration is defined in `docs/features/admin/plans/SPEC.md` and must be created separately if it doesn't already exist.

---

## Files to Create / Modify

```
supabase/migrations/
├── YYYYMMDDHHMMSS_create_tenants.sql
├── YYYYMMDDHHMMSS_create_tenant_branding.sql
├── YYYYMMDDHHMMSS_create_tenant_products.sql
└── YYYYMMDDHHMMSS_fix_backoffice_users_rls.sql

apps/admin/
├── package.json                          ← add @tanstack/react-query + devtools
└── src/
    ├── app/
    │   └── providers.tsx                 ← add QueryClientProvider
    ├── lib/
    │   ├── query-client.ts               ← CREATE — getQueryClient() singleton
    │   └── query-keys.ts                 ← CREATE — centralized query keys object

docs/architecture/
└── conventions.md                        ← add RLS and roles sections
```

---

## Acceptance Criteria

- [ ] 4 migrations applied without error via `supabase db push`
- [ ] Types regenerated via `pnpm db:types` reflect the new tables
- [ ] `@tanstack/react-query` installed and `QueryClientProvider` in `providers.tsx`
- [ ] `getQueryClient()` and `queryKeys` available in `src/lib/`
- [ ] `backoffice_users` with adjusted RLS (read for all roles, write only for `super_admin`)
- [ ] `docs/architecture/conventions.md` updated with the RLS and roles pattern

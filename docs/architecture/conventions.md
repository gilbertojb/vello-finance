# Project Conventions — Vello Finance

## Folder Structure per App (Next.js App Router)

All 3 Next.js apps (`admin`, `console`, `store`) use a `src/` directory:

```
apps/[admin|console|store]/src/
├── app/
│   ├── layout.tsx              ← Root layout (font + html/body + Providers)
│   ├── providers.tsx           ← ThemeProvider + TooltipProvider ('use client')
│   ├── globals.css             ← CSS variables + shadcn base + Vello tokens
│   ├── (public)/               ← Route group: unauthenticated routes
│   │   ├── layout.tsx          ← Two-column layout (form + decorative)
│   │   └── sign-in/
│   │       ├── page.tsx
│   │       └── sign-in-form.tsx
│   ├── (private)/              ← Route group: authenticated routes
│   │   ├── layout.tsx          ← SidebarProvider + Header + content
│   │   └── [modules]/          ← E.g.: (dashboard)/, tenants/, plans/
│   ├── not-found/page.tsx      ← Styled 404 (proxy rewrite when tenant doesn't exist)
│   ├── unavailable/page.tsx    ← Styled 503 (proxy rewrite when tenant is inactive)
│   └── api/                    ← Route Handlers (when an Edge Function isn't enough)
├── assets/                     ← SVGs and static images imported in code
├── components/
│   ├── ui/                     ← shadcn/ui (CLI-generated — do not edit)
│   ├── header.tsx              ← Shared header (server component)
│   └── sidebar/                ← Sidebar components (see pattern below)
├── hooks/                      ← Reusable custom hooks
├── http/                       ← Server Actions that are NOT form-related (e.g.: sign-out)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← Browser client — auth.signOut() only
│   │   ├── server.ts           ← Server client (RSC + Actions) — respects RLS
│   │   ├── service.ts          ← Service client (secret key) — bypasses RLS
│   │   └── proxy.ts            ← updateSession helper for the proxy
│   └── utils.ts                ← cn()
└── proxy.ts                    ← Next.js 16 entry point (formerly middleware.ts) — redirect logic
```

### Route Groups: `(public)` and `(private)`

| Group | Routes | Layout |
|---|---|---|
| `(public)` | sign-in, forgot-password, sign-up | Two columns: form + decorative image |
| `(private)` | dashboard, authenticated modules | `SidebarProvider` + `Header` |

## Module Structure (standard for all apps)

```
src/app/(private)/plans/
├── page.tsx                    ← Server Component — listing
├── new/
│   └── page.tsx                ← Server Component — creation form
├── [id]/
│   ├── page.tsx                ← Server Component — details
│   └── edit/
│       └── page.tsx            ← Server Component — edit form
├── actions.ts                  ← Server Actions (create, update, delete, toggle)
├── queries.ts                  ← Supabase query functions (reusable)
└── _components/                ← Client Components of the module (_ prefix = private)
    ├── plan-table.tsx
    ├── plan-form.tsx
    └── plan-status-badge.tsx
```

## Naming

| Item | Convention | Example |
|---|---|---|
| Apps | kebab-case | `admin`, `console`, `store` |
| Packages | kebab-case | `auth`, `database`, `transactional` |
| Components | PascalCase | `ProposalCard.tsx` |
| Server Actions | camelCase with verb | `createTenant`, `updateProduct` |
| Queries | camelCase with `get`/`list` | `getTenant`, `listProducts` |
| Hooks | camelCase with `use` | `useTenant`, `useProposals` |
| DB Tables | plural snake_case | `commission_snapshots`, `tenant_products` |
| DB Columns | snake_case | `tenant_id`, `created_at`, `bank_commission_pct` |
| DB Enums | snake_case | `proposal_status`, `product_type` |
| Migrations | `YYYYMMDDHHMMSS_description.sql` | `20260401120000_create_plans.sql` |
| Branches | `feat/`, `fix/`, `chore/` | `feat/admin-products` |
| Commits | Conventional Commits with scope | `feat(admin): adds product CRUD` |

### Code Language

**All code must be in English**: variable names, TypeScript interface properties, URL query params, and function names.

- URL query params: `from`, `to`, `product`, `stage`, `status` — never `de`, `ate`, `produto`, `estagio`
- TypeScript properties: `toReceive`, `received`, `abandoned`, `contracted`, `conversionRate`, `requestedVolume` — never `aReceber`, `recebidas`, `abandonaram`, `contrataram`, `taxaConversao`, `volumeSolicitado`
- Allowed exception: UI strings shown to the user remain in Portuguese (e.g.: labels, button text)

**Valid scopes in commits:**
`admin` · `console` · `store` · `api` · `packages/auth` · `packages/database` · `packages/env` · `packages/transactional` · `packages/config` · `supabase`

## `actions.ts` vs `src/http/`

| | `actions.ts` | `src/http/` |
|---|---|---|
| **Use** | Server Actions for **forms** | Server Actions **without a form** |
| **Location** | Co-located with the module (`plans/actions.ts`) | `src/http/<name>.ts` (global in the app) |
| **Examples** | `createPlan`, `updateTenant`, `deletePlan` | `sign-out.ts`, `activate-tenant.ts` |
| **Imported by** | `sign-in-form.tsx`, `plan-form.tsx` (via `useFormState`) | Components that trigger actions without a form |

## Server Action Pattern (forms)

```typescript
// app/(private)/plans/actions.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const planSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['signature', 'white_label']),
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

## Reusable Query Pattern

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

## Migration Pattern (Supabase)

```sql
-- supabase/migrations/20260401120000_create_plans.sql

-- Table
CREATE TABLE plans (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL UNIQUE,
  ...
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- automatic updated_at
CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON plans
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_read_active" ON plans
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );
```

> **Assumption:** anonymous authentication is disabled in the project. The condition `tenant_id IS NOT NULL` assumes that any JWT present belongs to an authenticated user. If anonymous authentication is enabled, add: `AND (auth.jwt() ->> 'role') = ANY(ARRAY['tenant_admin','tenant_operator'])`.

## Environment Variables per App

Each app imports its schema from `packages/env`:

```typescript
// apps/admin/env.ts
import { createEnv } from '@vello/env/admin'
export const env = createEnv()

// apps/console/env.ts
import { createEnv } from '@vello/env/console'
export const env = createEnv()
```

Required variables in all apps:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=   # never expose on the client
```

## Error Handling

- **Client Components:** `toast` (sonner) for user feedback
- **Server Actions:** return `{ error: string | FieldErrors }` or `{ success: true, data?: T }`
- **Never expose stack traces to the user**
- **Unexpected errors:** log on the server with context (`user_id`, `tenant_id`, `action`)
- **Supabase errors:** handle the `error.code` field for friendly messages (e.g.: `23505` = duplicate)

## Architecture: Fat Server, Thin Client

### Core rule

The browser **NEVER** talks directly to Supabase.
Every database call is made on the server (Server Components, Server Actions, Route Handlers).

**✅ CORRECT — data fetched on the server:**
```tsx
// app/(app)/plans/page.tsx — Server Component
import { createClient } from '@/lib/supabase/server'

export default async function PlansPage() {
  const supabase = await createClient()
  const { data } = await supabase.from('plans').select('*')
  return <PlanTable plans={data} />
}
```

**❌ WRONG — data fetched on the client:**
```tsx
'use client'
import { createClient } from '@/lib/supabase/client' // NEVER on data pages

export default function PlansPage() {
  const [plans, setPlans] = useState([])
  useEffect(() => {
    createClient().from('plans').select('*').then(...) // FORBIDDEN
  }, [])
}
```

**✅ CORRECT — mutation via Server Action:**
```tsx
// app/(app)/plans/actions.ts
'use server'
import { createClient } from '@/lib/supabase/server'

export async function createPlan(formData: FormData) {
  const supabase = await createClient() // server client — not exposed
  await supabase.from('plans').insert(...)
}
```

**❌ WRONG — mutation via client-side fetch:**
```tsx
'use client'
// NEVER call supabase.from() directly in a client component for mutations
```

### When `supabase/client.ts` may be used

Only for these specific cases, with no database access:
- `supabase.auth.getUser()` — check active session on the client
- `supabase.auth.signOut()` — logout
- Realtime subscriptions (when real-time notifications are needed — document explicitly)

### Required data flow
```
Browser                    Server (Next.js)             Supabase
  │                               │                         │
  │── clicks "Save" ─────────────▶│                         │
  │                        Server Action                    │
  │                               │── INSERT/SELECT ───────▶│
  │                               │◀── result ───────────────│
  │◀── redirect or toast ─────────│                         │
```

### Checks before creating any file

Before writing code that accesses data, ask:
1. Does this file have `'use client'`? → It CANNOT import `supabase/server` or run queries
2. Is this file a Server Component or does it have `'use server'`? → It CAN run queries
3. Do I need data on the client? → Receive it via props from the parent Server Component

## Server / Client Separation

| File | Directive | Accesses Supabase? |
|---|---|---|
| `page.tsx` | none (Server Component by default) | ✅ Yes |
| `layout.tsx` | none (Server Component by default) | ✅ Yes |
| `queries.ts` | none (server module) | ✅ Yes |
| `actions.ts` | `'use server'` | ✅ Yes |
| `_components/*.tsx` | `'use client'` | ❌ Never |
| `hooks/*.ts` | `'use client'` | ❌ Never |

Data reaches Client Components exclusively via props passed from the parent Server Component.

## Component Naming

```typescript
// plans-table.tsx
export function PlansTable() { ... }  // ← PascalCase on export
```

## File Naming

```text
_components/plans-table.tsx <- kebab-case
```
## UI Rule: No Arbitrary Color or Dimension Values

**Never use hardcoded values in Tailwind classes.** Every color, size, or dimension value must reference a design system token.

### ❌ Wrong

```tsx
// Hardcoded colors
<div className="bg-[#F0F2F7] dark:bg-zinc-950">
<div className="border-[#E4E7F0] dark:border-zinc-800">
<span className="dark:bg-[#1E2D5A] dark:text-[#7B9EEE]">

// Hardcoded dimensions
<header className="h-[52px]">
<aside className="w-[220px]">

// Font sizes outside the scale
<span className="text-[10px]">
<span className="text-[11px]">  // text-xs is already 11px

// CSS variables without mapping
<aside className="w-[var(--sidebar-width)]">
```

### ✅ Correct

```tsx
// Design system color tokens
<div className="bg-page-bg">
<div className="border-sidebar-border">
<span className="bg-sidebar-accent text-sidebar-accent-foreground">

// Design system dimension tokens
<header className="h-topbar">
<aside className="w-sidebar">

// Defined typographic scale
<span className="text-2xs">   // 10px → defined in globals.css
<span className="text-xs">    // 11px → Tailwind default
```

### How to add a token

When an arbitrary value seems necessary, **first add a token** in `apps/[app]/app/globals.css`:

```css
/* 1. Define the CSS variable (with the semantic value) */
:root  { --meu-token: oklch(...); }
.dark  { --meu-token: oklch(...); }

/* 2. Map it to a Tailwind utility in @theme inline */
@theme inline {
  --color-meu-token: var(--meu-token);   /* → bg-meu-token, text-meu-token */
  --width-meu-token: var(--meu-token);   /* → w-meu-token                   */
  --height-meu-token: var(--meu-token);  /* → h-meu-token                   */
  --text-meu-token: 0.75rem;             /* → text-meu-token                */
}
```

### Available layout tokens

| Utility | Value | Description |
|---|---|---|
| `bg-page-bg` | `#F0F2F7` / zinc-950 | Page background (behind panels) |
| `bg-sidebar` | white / zinc-900 | Sidebar and topbar background |
| `bg-card` | white / zinc-900 | Card and panel background |
| `bg-sidebar-accent` | vello-subtle / `#1E2D5A` | Active item in the sidebar |
| `text-sidebar-accent-foreground` | vello-blue / `#7B9EEE` | Text of the active sidebar item |
| `border-sidebar-border` | `#E4E7F0` / zinc-800 | Internal sidebar borders |
| `border-border` | `#E4E7F0` / zinc-800 | General borders |
| `w-sidebar` | `220px` | Sidebar width |
| `h-topbar` | `52px` | Topbar height |
| `text-2xs` | `10px` | Badges and supporting labels |

### Mandatory Rule: Semantic Tokens (compatibility with tenant themes)

The `console` and `store` apps support white-label — the visual theme is overridden per tenant via CSS variables injected in `[data-tenant-theme="slug"]`. **Using fixed colors (zinc-800, white, slate-500, etc.) breaks the tenant's theme.**

**✅ Correct — semantic tokens that respond to the theme:**
```tsx
<h1 className="text-foreground">Title</h1>
<p className="text-muted-foreground">Subtitle</p>
<div className="bg-background border-border">...</div>
<input className="bg-input border-input" />
<button className="bg-primary text-primary-foreground">Action</button>
```

**❌ Wrong — hardcoded colors that ignore the theme:**
```tsx
<h1 className="text-white">Title</h1>
<p className="text-zinc-400">Subtitle</p>
<div className="bg-zinc-900 border-zinc-700">...</div>
<input className="bg-zinc-800 border-zinc-700 text-white" />
```

**Quick substitution map:**

| Hardcoded | Semantic token |
|---|---|
| `text-white` / `text-black` | `text-foreground` |
| `text-zinc-400` / `text-gray-500` | `text-muted-foreground` |
| `text-zinc-300` | `text-foreground` (labels inherit from the `FieldLabel` component) |
| `bg-zinc-800` / `bg-zinc-900` | `bg-background` or `bg-card` |
| `bg-white` | `bg-background` |
| `border-zinc-700` / `border-zinc-800` | `border-border` or `border-input` |
| `bg-red-50 border-red-200` | Use the component variant (e.g.: `<Alert variant="destructive">`) |

> **Rule:** if you're writing a Tailwind color class and the name contains a number (zinc-800, gray-500, red-50), it's wrong. Use the equivalent semantic token.

### Allowed exceptions

- `app/page.tsx` (temporary `create-next-app` boilerplate — will be replaced)
- Inline SVGs: `stroke="white"` attribute and similar (not Tailwind classes)
- Opacity values on existing tokens: `text-foreground/70` is allowed

## Sidebar Pattern (shadcn + server/client split)

The sidebar is composed using the shadcn `sidebar` primitives with a mandatory split between server and client components:

```
src/components/sidebar/
├── index.tsx          ← Server — assembles the structure (Header, Content, Footer)
├── nav-main.tsx       ← Server — defines nav groups and items
├── nav-link.tsx       ← Client — detects the active route via usePathname()
├── nav-user.tsx       ← Server — user footer wrapper
└── profile-button.tsx ← Client — dropdown menu with logout
```

**Rule:** all interaction logic (active state, dropdowns, usePathname) stays in the `*-link.tsx` and `*-button.tsx` components. Server components only structure and pass data.

**Active item — standard classes:**
```tsx
isActive
  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
```

**Sidebar dimensions** — always via inline `style` on `SidebarProvider`, never hardcoded:
```tsx
<SidebarProvider
  style={{
    '--sidebar-width': 'calc(var(--spacing) * 72)',
    '--header-height': 'calc(var(--spacing) * 12)',
  } as React.CSSProperties}
>
```

## Metadata and Page Title Pattern

Every page exports `metadata` to compose the title with the root layout's template:

```tsx
// Root layout defines the template
export const metadata: Metadata = {
  title: { template: '%s | Vello Admin', default: 'Vello Admin' },
}

// Each page.tsx defines its own title
export const metadata = { title: 'Tenants' }
// Result: "Tenants | Vello Admin"
```

The shared `Header` **does not receive a title as a prop** — use `metadata`.

## Form System (`Field`)

Forms **never** use a standalone `<input>`. Always use the `Field` system:

```tsx
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">Email</FieldLabel>
    <Input id="email" type="email" name="email" />
    <FieldError errors={formState.errors?.email} />
  </Field>
</FieldGroup>
```

**Available components:** `Field`, `FieldGroup`, `FieldLabel`, `FieldTitle`,
`FieldDescription`, `FieldError`, `FieldContent`, `FieldSeparator`, `FieldSet`, `FieldLegend`.

`Field` supports `orientation`: `vertical` (default) | `horizontal` | `responsive`.

## `useFormState` Hook (Server Actions)

For forms that call Server Actions:

```tsx
'use client'
import { useFormState } from '@/hooks/use-form-state'

const [formState, handleSubmit, isPending] = useFormState(
  myServerAction,
  () => router.push('/success'),     // onSuccess
  (msg) => toast.error(msg),         // onError
)
```

**Required Server Action contract:**
```ts
return {
  success: boolean,
  message: string | null,
  errors: Record<string, string[]> | null,  // key = field name
}
```

## Providers — Location and Content

`providers.tsx` lives in `src/app/` (co-located with `layout.tsx`), not in `lib/`.
Always includes `ThemeProvider` **and** `TooltipProvider` together:

```tsx
// src/app/providers.tsx — 'use client'
export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
```

## RLS Pattern (Row Level Security)

Every new table must have RLS enabled. There are three categories:

### Category A — Backoffice tables (no tenant access)

Used in: `backoffice_users`, `plans`, `products`, `financial_partners`

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON [table]
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );
```

> Variation: when only `super_admin` should write, use two separate policies:
> - `backoffice_full_read` — FOR SELECT for all 4 roles
> - `super_admin_write` — FOR ALL USING (...) WITH CHECK (...) for `super_admin` only
>
> See: `supabase/migrations/20260401140000_fix_backoffice_users_rls.sql`

### Category B — Tables isolated per tenant

Used in: `tenant_products`, `tenant_branding`, `proposals`, `clients`

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON [table]
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_isolation" ON [table]
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

> Every Category B table must have `tenant_id UUID NOT NULL REFERENCES tenants(id)`.

### Category C — Global tables read by tenants

Used in: `plans`, `products` (when tenants need to read active records)

```sql
ALTER TABLE [table] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON [table]
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_read_active" ON [table]
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );
```

### Checklist when creating a new table

- [ ] Determine the category (A, B, or C)
- [ ] `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY`
- [ ] Apply the policies for the corresponding category
- [ ] If Category B: ensure `tenant_id UUID NOT NULL REFERENCES tenants(id)`

### Trigger naming

- `set_updated_at_<table>` — updated_at triggers (no prefix)
- `trg_<description>` — business triggers (with `trg_` prefix)

## Roles Pattern (DB ENUM ↔ `@vello/auth`)

The PostgreSQL ENUM is the **source of truth**. The `@vello/auth` package mirrors the exact values.

| PostgreSQL ENUM | Values | TypeScript (`@vello/auth`) |
|---|---|---|
| `backoffice_role` | `super_admin`, `admin`, `financial`, `support` | `BackofficeRole` |
| `tenant_role` | `tenant_admin`, `tenant_operator` | `TenantRole` |
| `tenant_type` | `whitelabel`, `subscription` | *(DB only)* |
| `tenant_status` | `pending`, `active`, `suspended`, `cancelled` | *(DB only)* |

**Rule:** when adding a new role:
1. `ALTER TYPE [enum_name] ADD VALUE 'new_role'` in the migration
2. Update `z.union([...z.literal('new_role')])` in `packages/auth/src/roles/role.ts`
3. Regenerate types: `pnpm db:types`
4. Update RLS policies that use `ANY(ARRAY[...])` if necessary

### Mandatory Rule: `@vello/auth` as the RBAC source in the apps

**Never insert hardcoded role arrays in the apps** (`admin`, `console`, `store`). Always import from `@vello/auth`:

```typescript
import { hasTenantAccess, hasBackofficeAccess, getJwtClaims } from '@vello/auth'

// ✅ Correct
if (!hasTenantAccess(claims.user_role)) { ... }

// ❌ Wrong — hardcoded
if (!['tenant_admin', 'tenant_operator'].includes(role)) { ... }
```

| Function | Use |
|---|---|
| `hasTenantAccess(role)` | Checks if the role is `tenant_admin` or `tenant_operator` |
| `hasBackofficeAccess(role)` | Checks if the role is any backoffice role |
| `isTenantRole(role)` | Alias for `hasTenantAccess` |
| `isBackofficeRole(role)` | Alias for `hasBackofficeAccess` |
| `getJwtClaims(user)` | Extracts and validates JWT claims via Zod |
| `jwtClaimsSchema` | Zod schema for the claims |

> **Adoption status:**
> - `apps/console` — mandatory from the start (implemented in this spec)
> - `apps/admin` — pending audit to align with the pattern

---

## Session Isolation

### Between Apps (Admin × Console)

Both apps use the same Supabase project. To prevent sessions from leaking between apps on subdomains of the same parent domain (`.vellofinance.com.br`), each app uses a distinct `storageKey` on **all** Supabase clients:

```typescript
// apps/admin — fixed storageKey (there is only one "tenant": Vello itself)
createServerClient(url, key, {
  auth: { storageKey: 'vello-admin-auth' },
  cookies: { ... }
})
```

### Between Tenants (Console)

In the console, each tenant has its own session cookie. The `storageKey` is dynamic and uses the `tenant_id` (UUID) — never the slug (which is public in the URL and guessable):

```typescript
// apps/console — dynamic storageKey per tenant_id
import { getStorageKey } from './storage-key'

// storage-key.ts → `vello-console-auth-${tenantId}`
createServerClient(url, key, {
  auth: { storageKey: getStorageKey(tenantId) },
  cookies: { ... }
})
```

**How `tenantId` reaches each layer:**

| File | Source of `tenantId` |
|---|---|
| `proxy.ts` (middleware) | `resolveTenant(host)` → passes `tenant.id` to `updateSession()` |
| `lib/supabase/server.ts` | `headers().get('x-tenant-id')` — injected by the middleware |
| `lib/supabase/client.ts` | `document.documentElement.dataset.tenantId` — injected into `<html>` by the root layout |
| `lib/supabase/proxy.ts` | Receives `tenantId` as a parameter of `updateSession(request, tenantId)` |

**Security (defense in depth):**
1. Cookie per tenant_id (UUID) — tenant A's session simply does not exist in tenant B's context
2. Middleware validates `claims.tenant_id === tenant.id` — rejects cross-tenant access even with a valid cookie
3. RLS in the database filters by `(auth.jwt() ->> 'tenant_id')::uuid` — protection at the data layer

Additionally, each app's middleware validates the JWT's `user_role` via `@vello/auth`:
- **Console:** rejects backoffice roles → signOut + redirect `/sign-in`
- **Admin:** rejects tenant roles → signOut + redirect `/sign-in` *(pending implementation)*

## Structuring and Import Rules

### One Component per File

It is **wrong** to declare multiple exported React components in the same file. The strict convention is: **one file per component**.

**❌ Wrong — multiple components in the same file:**
```tsx
// _components/dashboard-cards.tsx
export function CardA() { return <div /> }
export function CardB() { return <div /> }

export function DashboardCards() {
  return (
    <>
      <CardA />
      <CardB />
    </>
  )
}
```

**✅ Correct — separate files:**
```tsx
// _components/card-a.tsx
export function CardA() { return <div /> }

// _components/card-b.tsx
export function CardB() { return <div /> }

// _components/dashboard-cards.tsx
import { CardA } from './card-a'
import { CardB } from './card-b'

export function DashboardCards() {
  return (
    <>
      <CardA />
      <CardB />
    </>
  )
}
```

### Functions and Helpers

When you have utility functions or logic (helpers), create a single file for them. If a function or helper is used in more than one place, you must extract it into a shared/standard helper (for example, in the `src/lib/` folder or a `utils` directory).

### Absolute Imports (`@/`)

**Never** use relative path navigation going back multiple directories (`../../../`) when importing files. Always use the project's absolute import shortcut `@/`.

**❌ Wrong:**
```tsx
import { Button } from '../../../../components/ui/button'
import { cn } from '../../../lib/utils'
```

**✅ Correct:**
```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

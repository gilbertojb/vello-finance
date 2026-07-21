# Spec — Supabase Integration

**App:** `apps/admin` (pattern replicated later for `console` and `store`)
**Status:** `implemented`
**Priority:** Blocking — all modules depend on this integration

---

## Overview

The integration follows the official `@supabase/ssr` pattern with four layers:

```
Browser (Client Component)
  └── lib/supabase/client.ts       ← createBrowserClient — only auth.signOut()

Server (Server Component / Action)
  └── lib/supabase/server.ts       ← createServerClient — all data queries
  └── lib/supabase/service.ts      ← createClient with secret key — bypasses RLS

Proxy (Edge) — Next.js 16 renamed Middleware to Proxy
  └── proxy.ts                     ← route logic (redirects) — Next.js entry point
  └── lib/supabase/proxy.ts        ← updateSession: Supabase session + isAuthenticated
```

> **Next.js 16:** The middleware file is now called `proxy.ts` (it used to be `middleware.ts`).
> The exported function must be `proxy` (or a default export). `middleware.ts` is no longer used.

**Core rule (Fat Server):** database queries NEVER on the browser client.
The browser client exists exclusively for `auth.signOut()`.

---

## Phase 1 — CLI and Project Setup

### 1.1 Install and link the Supabase CLI

```bash
# At the monorepo root
brew install supabase/tap/supabase   # macOS
# or: npm install -g supabase

supabase login
supabase link --project-ref SEU_PROJECT_REF
```

> The `PROJECT_REF` is in the dashboard URL: `supabase.com/dashboard/project/[PROJECT_REF]`

### 1.2 Initialize local structure

```bash
# At the monorepo root (if supabase/ doesn't exist yet)
supabase init
```

Expected result:
```
supabase/
├── config.toml
└── migrations/    ← empty for now
```

### 1.3 Verify connection

```bash
supabase status
```

Should return the linked project with `API URL` and `anon key`.

---

## Phase 2 — Environment Variables

### 2.1 Create `.env.local` at the monorepo root

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # publishable key
SUPABASE_SECRET_KEY=sb_secret_...                         # secret key — NEVER expose on the client
RESEND_API_KEY=re_...
```

> The keys are at: Supabase Dashboard → Project Settings → API

### 2.2 Create `.env.example` (committed to git)

```bash
# .env.example
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

### 2.3 Make sure `.env.local` is in `.gitignore`

```bash
# .gitignore (monorepo root — should already exist)
.env.local
.env*.local
```

### 2.4 Expand `packages/env` with the admin schema

```typescript
// packages/env/src/admin.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    SUPABASE_SECRET_KEY: z.string().min(1),
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
})
```

---

## Phase 3 — Supabase Clients

### 3.1 Install dependencies

```bash
pnpm add @supabase/ssr @supabase/supabase-js --filter=admin
```

### 3.2 Browser Client — `apps/admin/src/lib/supabase/client.ts`

```typescript
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@vello/database'
import { env } from '@vello/env/admin'

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
```

> Allowed use: ONLY in Client Components for `auth.getUser()` and `auth.signOut()`.
> NEVER use `supabase.from()` here.

### 3.3 Server Client — `apps/admin/src/lib/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@vello/database'
import { env } from '@vello/env/admin'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server Component — cookies can only be written in Actions/Route Handlers
          }
        },
      },
    },
  )
}
```

### 3.4 Service Role Client — `apps/admin/src/lib/supabase/service.ts`

```typescript
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@vello/database'
import { env } from '@vello/env/admin'

// Client with full permissions — bypasses RLS
// Use ONLY in Server Actions and Edge Functions that need unrestricted access
// E.g.: creating a user when activating a tenant, admin operations without a tenant_id
export function createServiceClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
  )
}
```

> **Warning:** this client bypasses RLS completely.
> Use only when explicitly necessary (e.g.: provisioning a tenant, creating an admin user).

---

## Phase 4 — Proxy (Middleware in Next.js 16)

In Next.js 16, the middleware file is called `proxy.ts`. The Supabase session logic
is isolated in `lib/supabase/proxy.ts`; `src/proxy.ts` contains only the redirect rules.

### `apps/admin/src/lib/supabase/proxy.ts`

Creates the Supabase client, updates cookies, and returns `isAuthenticated`:

```typescript
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; isAuthenticated: boolean }> {
  // createServerClient + getUser() — don't add code between the two
  const { data } = await supabase.auth.getUser()
  return { response: supabaseResponse, isAuthenticated: !!data?.user }
}
```

### `apps/admin/src/proxy.ts`

Next.js 16 entry point. Delegates the session to `updateSession` and applies redirects:

```typescript
import { updateSession } from '@/lib/supabase/proxy'

const publicRoutesPatterns = [
  { path: '/sign-in', whenAuthenticated: 'redirect' as const },
  { path: '/forgot-password', whenAuthenticated: 'redirect' as const },
  { path: '/reset-password', whenAuthenticated: 'next' as const },
]

export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request)

  // Not authenticated on a protected route → /sign-in
  // Authenticated on a route with whenAuthenticated: 'redirect' → /
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Phase 5 — Auth with Custom JWT Claims (RBAC)

### Concept

Supabase Auth generates standard JWTs. To add `role` and `tenant_id` to the token,
we use an **Auth Hook** of type `custom_access_token` that runs an Edge Function
before the JWT is issued.

```
User login
      ↓
Supabase Auth validates credentials
      ↓
Hook: custom_access_token (PostgreSQL Function)
      ↓
Looks up role and tenant_id in the backoffice_users table
      ↓
Injects into the JWT: { user_role: 'super_admin', tenant_id: null }
      ↓
JWT returned to the client with custom claims
      ↓
RLS policies read (auth.jwt() ->> 'user_role') and (auth.jwt() ->> 'tenant_id')
```

### 5.1 Migration — `backoffice_users` Table

```sql
-- supabase/migrations/20260401000001_create_backoffice_users.sql

CREATE TYPE backoffice_role AS ENUM (
  'super_admin',
  'admin',
  'financial',
  'support'
);

CREATE TABLE backoffice_users (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role      backoffice_role NOT NULL DEFAULT 'support',
  full_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_backoffice_users
  BEFORE UPDATE ON backoffice_users
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- RLS: only super_admin manages backoffice users
ALTER TABLE backoffice_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_users_self_read" ON backoffice_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "backoffice_users_super_admin" ON backoffice_users
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = 'super_admin'
  );
```

### 5.2 PostgreSQL Function — Custom Access Token Hook

Instead of an Edge Function, we use a PostgreSQL function to keep isolation and greater security (by not exposing HTTP traffic for token manipulation).

It is defined via SQL and receives restricted privileges:

```sql
-- migration that creates the function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
  DECLARE
    claims jsonb;
    backoffice_user record;
    tenant_user record;
  BEGIN
    claims := event->'claims';

    -- Try to look up as a backoffice user
    SELECT role, is_active INTO backoffice_user
    FROM public.backoffice_users
    WHERE id = (event->>'user_id')::uuid;

    IF backoffice_user.is_active = true THEN
      claims := jsonb_set(claims, '{user_role}', to_jsonb(backoffice_user.role));
      claims := jsonb_set(claims, '{tenant_id}', 'null'::jsonb);
    ELSE
      -- Try to look up as a tenant user
      SELECT role, tenant_id, is_active INTO tenant_user
      FROM public.tenant_users
      WHERE id = (event->>'user_id')::uuid;

      IF tenant_user.is_active = true THEN
        claims := jsonb_set(claims, '{user_role}', to_jsonb(tenant_user.role));
        claims := jsonb_set(claims, '{tenant_id}', to_jsonb(tenant_user.tenant_id));
      END IF;
    END IF;

    -- Update the claims object in the original event
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
  END;
$$;

-- Revoke public access and grant it to the auth admin
REVOKE ALL PRIVILEGES ON FUNCTION public.custom_access_token_hook(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;
```

### 5.3 Configure the Hook in the Dashboard

```
Supabase Dashboard
  → Authentication
  → Hooks
  → Add hook: "Custom Access Token"
  → Type: PostgreSQL
  → Schema: public
  → Function: custom_access_token_hook
  → Save
```

> This step is done **manually in the dashboard** (there is no CLI for this yet).

### 5.4 JWT Types in `packages/auth`

```typescript
// packages/auth/src/types.ts

export type BackofficeRole = 'super_admin' | 'admin' | 'financial' | 'support'
export type TenantRole = 'tenant_admin' | 'tenant_operator'
export type SystemRole = BackofficeRole | TenantRole

export interface JwtClaims {
  user_role: SystemRole
  tenant_id: string | null
}

// Helper: extracts claims from the authenticated user (server-side)
export function getJwtClaims(
  user: { app_metadata?: Record<string, unknown> } | null,
): JwtClaims | null {
  if (!user?.app_metadata) return null
  const user_role = user.app_metadata.user_role as SystemRole | undefined
  const tenant_id = user.app_metadata.tenant_id as string | null | undefined
  if (!user_role) return null
  return { user_role, tenant_id: tenant_id ?? null }
}

// Permission-check helpers
export function isBackoffice(claims: JwtClaims | null): boolean {
  if (!claims) return false
  return ['super_admin', 'admin', 'financial', 'support'].includes(claims.user_role)
}

export function isSuperAdmin(claims: JwtClaims | null): boolean {
  return claims?.user_role === 'super_admin'
}

export function hasRole(
  claims: JwtClaims | null,
  roles: SystemRole[],
): boolean {
  if (!claims) return false
  return roles.includes(claims.user_role)
}
```

---

## Phase 6 — Seed: First Admin User

```sql
-- supabase/seed.sql

-- 1. Create the user in Supabase Auth via a helper function
-- (run via Supabase Dashboard → SQL Editor, or via a script)

-- Insert the profile after manually creating the user in Dashboard → Auth → Users
INSERT INTO backoffice_users (id, role, full_name)
VALUES (
  'UUID_DO_USUARIO_CRIADO_NO_DASHBOARD',
  'super_admin',
  'Admin Vello'
);
```

> The user is created first at: Dashboard → Authentication → Users → Add User.
> Then the generated `id` is used in the INSERT above.

---

## Phase 7 — Database Types

### 7.1 Create a placeholder in `packages/database`

```typescript
// packages/database/src/types.ts
// Automatically generated by the Supabase CLI — do not edit manually
// Regenerate with: pnpm db:types

export type Database = {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
  }
}
```

### 7.2 Script in turbo.json

```json
// packages/database/package.json
{
  "name": "@vello/database",
  "scripts": {
    "db:types": "supabase gen types typescript --linked > src/types.ts"
  }
}
```

```json
// turbo.json — add task
{
  "tasks": {
    "db:types": {
      "cache": false
    }
  }
}
```

```json
// root package.json — add script
{
  "scripts": {
    "db:types": "turbo db:types"
  }
}
```

---

## Phase 8 — Sign-In Page

> Preserves the project's existing pattern: `(public)/sign-in` route, custom
> `useFormState` hook, the project's own `Field/FieldError/FieldGroup/FieldLabel` components.
> Only the transport layer changes: from `ky` + manual cookie to Supabase Auth.

### File structure

```
apps/admin/src/app/(public)/sign-in/
├── page.tsx           ← no change
├── sign-in-form.tsx   ← no change
└── actions.ts         ← ONLY THIS FILE CHANGES
```

---

### `page.tsx` — no change

```tsx
import { SignInForm } from './sign-in-form'

export default function SignInPage() {
  return (
    <div className="w-full max-w-sm">
      <SignInForm />
    </div>
  )
}
```

---

### `sign-in-form.tsx` — no change

The component remains exactly as it is. It has no knowledge of the auth mechanism —
it only consumes the action via `useFormState` and renders errors.

```tsx
'use client'

import { AlertCircleIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import { useFormState } from '@/hooks/use-form-state'

import { signInWithEmailAndPassword } from './actions'

export function SignInForm({ ...props }: React.ComponentProps<'form'>) {
  const router = useRouter()

  const [{ errors, message, success }, handleSubmit, isPending] = useFormState(
    signInWithEmailAndPassword,
    () => {
      router.push('/')
    },
  )

  return (
    <form onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold">Acesse sua conta</h1>
          <p className="text-muted-foreground text-sm text-balance">
            Insira seus dados abaixo para acessar sua conta
          </p>
        </div>

        {success === false && message && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircleIcon />
            <AlertTitle>Houve um erro ao entrar na sua conta!</AlertTitle>
            <AlertDescription className="text-xs">{message}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors?.email}>
          <FieldLabel htmlFor="email">Informe seu e-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            name="email"
            aria-invalid={!!errors?.email}
          />
          <FieldError errors={errors?.email} />
        </Field>

        <Field data-invalid={!!errors?.password}>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Informe sua senha</FieldLabel>
            <a
              href="/forgot-password"
              className="ml-auto text-xs text-primary hover:text-primary/80"
            >
              Esqueceu sua senha?
            </a>
          </div>
          <Input
            id="password"
            type="password"
            name="password"
            aria-invalid={!!errors?.password}
          />
          <FieldError errors={errors?.password} />
        </Field>

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Continuar'
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
```

---

### `actions.ts` — full replacement

- Use `createClient()` from the Supabase server
- Supabase manages the session via cookies automatically (via `@supabase/ssr`)
- Keeps the `{ success, message, errors }` return shape that `useFormState` expects

```typescript
'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const signInSchema = z.object({
  email: z.string().email({ message: 'Por favor, informe um e-mail válido.' }),
  password: z.string().min(1, { message: 'Por favor, informe sua senha.' }),
})

export async function signInWithEmailAndPassword(data: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors

    return { success: false, message: null, errors }
  }

  const { email, password } = result.data

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Don't expose technical Supabase details to the user
    return {
      success: false,
      message: 'E-mail ou senha incorretos.',
      errors: null,
    }
  }

  // Supabase @supabase/ssr manages session cookies automatically.
  // No need to set a cookie manually.
  return { success: true, message: null, errors: null }
}
```

> **Why isn't there a `redirect()` in the action?**
> Your `useFormState` hook detects `success: true` and runs the callback
> `() => router.push('/')` on the client. The redirect happens client-side,
> not in the Server Action — this is the correct behavior for the pattern you use.

---

### Update proxy — correct route

The proxy needs to point to `/sign-in`:

```typescript
// apps/admin/src/proxy.ts

const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in')

// Redirect to sign-in if not authenticated
if (!user && isProtectedRoute) {
  const url = request.nextUrl.clone()
  url.pathname = '/sign-in'
  return NextResponse.redirect(url)
}

// Redirect to dashboard if already authenticated
if (user && isAuthRoute) {
  const url = request.nextUrl.clone()
  url.pathname = '/'
  return NextResponse.redirect(url)
}
```

---

## Execution Order for Claude Code

```
Phase 1  → supabase link
Phase 2  → .env.local + packages/env/src/admin.ts
Phase 3  → src/lib/supabase/client.ts + server.ts + service.ts
Phase 4  → src/proxy.ts (route: /sign-in, redirect: /)
Phase 5  → backoffice_users migration + PostgreSQL hook + configure hook in the dashboard
Phase 6  → seed (manual in the dashboard)
Phase 7  → packages/database placeholder + pnpm db:types
Phase 8  → sign-in actions.ts (replace ky with Supabase) + sign-out-button.tsx
```

> `page.tsx` and `sign-in-form.tsx` need no changes — keep them as they are.

---

## Completion Criteria

- [x] `supabase status` returns the linked project
- [x] `.env.local` filled in, `.env.example` committed
- [x] `packages/env/src/admin.ts` validating the variables (publishable/secret key)
- [x] `src/lib/supabase/client.ts`, `server.ts`, and `service.ts` created
- [x] proxy.ts redirecting to `/sign-in` without auth, to `/` with auth
- [x] middleware.ts re-exports proxy and config
- [x] `backoffice_users` migration applied: `supabase db push`
- [x] `custom_access_token_hook` PostgreSQL Function deployed via migrations
- [ ] "Custom Access Token" hook configured in the Dashboard (Authentication → Hooks)
- [ ] super_admin user created via dashboard + INSERT into `backoffice_users`
- [ ] Login works: `success: true` → `router.push('/')` via `useFormState`
- [ ] User's JWT contains `user_role: 'super_admin'` and `tenant_id: null`
- [x] `pnpm db:types` generates the types in `packages/database/src/types.ts`
- [ ] Direct access to `/` without login redirects to `/sign-in`
- [x] Auth errors return `{ success: false, message, errors: null }` — no technical details

# Spec — Integração com Supabase

**App:** `apps/admin` (padrão replicado depois para `console` e `store`)
**Status:** `implementado`
**Prioridade:** Bloqueante — todos os módulos dependem desta integração

---

## Visão Geral

A integração segue o padrão oficial `@supabase/ssr` com quatro camadas:

```
Browser (Client Component)
  └── lib/supabase/client.ts       ← createBrowserClient — apenas auth.signOut()

Servidor (Server Component / Action)
  └── lib/supabase/server.ts       ← createServerClient — todas as queries de dados
  └── lib/supabase/service.ts      ← createClient com secret key — bypassa RLS

Proxy (Edge) — Next.js 16 renomeou Middleware para Proxy
  └── proxy.ts                     ← lógica de rotas (redirects) — entry point do Next.js
  └── lib/supabase/proxy.ts        ← updateSession: sessão Supabase + isAuthenticated
```

> **Next.js 16:** O arquivo de middleware passou a se chamar `proxy.ts` (era `middleware.ts`).
> A função exportada deve ser `proxy` (ou default export). O `middleware.ts` não é mais usado.

**Regra central (Fat Server):** queries de banco NUNCA no browser client.
O browser client existe exclusivamente para `auth.signOut()`.

---

## Fase 1 — Setup do CLI e Projeto

### 1.1 Instalar e linkar o Supabase CLI

```bash
# Na raiz do monorepo
brew install supabase/tap/supabase   # macOS
# ou: npm install -g supabase

supabase login
supabase link --project-ref SEU_PROJECT_REF
```

> O `PROJECT_REF` está na URL do dashboard: `supabase.com/dashboard/project/[PROJECT_REF]`

### 1.2 Inicializar estrutura local

```bash
# Na raiz do monorepo (se ainda não existir supabase/)
supabase init
```

Resultado esperado:
```
supabase/
├── config.toml
└── migrations/    ← vazio por enquanto
```

### 1.3 Verificar conexão

```bash
supabase status
```

Deve retornar o projeto linkado com `API URL` e `anon key`.

---

## Fase 2 — Variáveis de Ambiente

### 2.1 Criar `.env.local` na raiz do monorepo

```bash
# .env.local
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # publishable key
SUPABASE_SECRET_KEY=sb_secret_...                         # secret key — NUNCA expor no cliente
RESEND_API_KEY=re_...
```

> As keys estão em: Supabase Dashboard → Project Settings → API

### 2.2 Criar `.env.example` (commitado no git)

```bash
# .env.example
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
```

### 2.3 Garantir que `.env.local` está no `.gitignore`

```bash
# .gitignore (raiz do monorepo — já deve existir)
.env.local
.env*.local
```

### 2.4 Expandir `packages/env` com schema do admin

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

## Fase 3 — Clients do Supabase

### 3.1 Instalar dependências

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
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  )
}
```

> Uso permitido: APENAS em Client Components para `auth.getUser()` e `auth.signOut()`.
> NUNCA usar `supabase.from()` aqui.

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
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
            // Server Component — cookies só podem ser escritos em Actions/Route Handlers
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

// Client com permissão total — bypassa RLS
// Usar APENAS em Server Actions e Edge Functions que precisam de acesso irrestrito
// Ex: criar usuário ao ativar tenant, operações de admin que não têm tenant_id
export function createServiceClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
  )
}
```

> **Atenção:** este client bypassa RLS completamente.
> Usar somente quando explicitamente necessário (ex: provisionar tenant, criar usuário admin).

---

## Fase 4 — Proxy (Middleware no Next.js 16)

No Next.js 16, o arquivo de middleware se chama `proxy.ts`. A lógica de sessão Supabase
fica isolada em `lib/supabase/proxy.ts`; o `proxy.ts` raiz contém apenas as regras de redirect.

### `apps/admin/src/lib/supabase/proxy.ts`

Cria o cliente Supabase, atualiza cookies e retorna `isAuthenticated`:

```typescript
export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; isAuthenticated: boolean }> {
  // createServerClient + getClaims() — não adicionar código entre os dois
  const { data } = await supabase.auth.getClaims()
  return { response: supabaseResponse, isAuthenticated: !!data?.claims }
}
```

### `apps/admin/proxy.ts`

Entry point do Next.js 16. Delega a sessão para `updateSession` e aplica redirects:

```typescript
import { updateSession } from '@/lib/supabase/proxy'

const publicRoutesPatterns = [
  { path: '/sign-in', whenAuthenticated: 'redirect' as const },
  { path: '/forgot-password', whenAuthenticated: 'redirect' as const },
  { path: '/reset-password', whenAuthenticated: 'next' as const },
]

export async function proxy(request: NextRequest) {
  const { response, isAuthenticated } = await updateSession(request)

  // Não autenticado em rota protegida → /sign-in
  // Autenticado em rota com whenAuthenticated: 'redirect' → /
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## Fase 5 — Auth com Custom Claims JWT (RBAC)

### Conceito

O Supabase Auth gera JWTs padrão. Para adicionar `role` e `tenant_id` ao token,
usamos um **Auth Hook** do tipo `custom_access_token` que executa uma Edge Function
antes de emitir o JWT.

```
Login do usuário
      ↓
Supabase Auth valida credenciais
      ↓
Hook: custom_access_token (Edge Function)
      ↓
Busca role e tenant_id na tabela backoffice_users
      ↓
Injeta no JWT: { role: 'super_admin', tenant_id: null }
      ↓
JWT retornado ao cliente com claims customizados
      ↓
RLS policies leem (auth.jwt() ->> 'role') e (auth.jwt() ->> 'tenant_id')
```

### 5.1 Migration — Tabela `backoffice_users`

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

-- RLS: apenas super_admin gerencia usuários do backoffice
ALTER TABLE backoffice_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_users_self_read" ON backoffice_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "backoffice_users_super_admin" ON backoffice_users
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  );
```

### 5.2 Edge Function — Custom Access Token Hook

```bash
# Criar a Edge Function
supabase functions new custom-access-token
```

```typescript
// supabase/functions/custom-access-token/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface WebhookPayload {
  user_id: string
  claims: Record<string, unknown>
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  const { user_id, claims } = payload

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // Tenta buscar como usuário do backoffice
  const { data: backofficeUser } = await supabase
    .from('backoffice_users')
    .select('role, is_active')
    .eq('id', user_id)
    .single()

  if (backofficeUser && backofficeUser.is_active) {
    return Response.json({
      ...claims,
      role: backofficeUser.role,
      tenant_id: null,
    })
  }

  // Tenta buscar como usuário de tenant
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('role, tenant_id, is_active')
    .eq('id', user_id)
    .single()

  if (tenantUser && tenantUser.is_active) {
    return Response.json({
      ...claims,
      role: tenantUser.role,
      tenant_id: tenantUser.tenant_id,
    })
  }

  // Usuário sem perfil — retorna claims sem role (será bloqueado pelo RLS)
  return Response.json(claims)
})
```

```bash
# Deploy da Edge Function
supabase functions deploy custom-access-token --no-verify-jwt
```

### 5.3 Configurar o Hook no Dashboard

```
Supabase Dashboard
  → Authentication
  → Hooks
  → Add hook: "Custom Access Token"
  → Function: custom-access-token
  → Salvar
```

> Este passo é feito **manualmente no dashboard** (não há CLI para isso ainda).

### 5.4 Tipos do JWT em `packages/auth`

```typescript
// packages/auth/src/types.ts

export type BackofficeRole = 'super_admin' | 'admin' | 'financial' | 'support'
export type TenantRole = 'tenant_admin' | 'tenant_operator'
export type SystemRole = BackofficeRole | TenantRole

export interface JwtClaims {
  role: SystemRole
  tenant_id: string | null
}

// Helper: extrai claims do usuário autenticado (server-side)
export function getJwtClaims(
  user: { app_metadata?: Record<string, unknown> } | null,
): JwtClaims | null {
  if (!user?.app_metadata) return null
  const role = user.app_metadata.role as SystemRole | undefined
  const tenant_id = user.app_metadata.tenant_id as string | null | undefined
  if (!role) return null
  return { role, tenant_id: tenant_id ?? null }
}

// Helpers de verificação de permissão
export function isBackoffice(claims: JwtClaims | null): boolean {
  if (!claims) return false
  return ['super_admin', 'admin', 'financial', 'support'].includes(claims.role)
}

export function isSuperAdmin(claims: JwtClaims | null): boolean {
  return claims?.role === 'super_admin'
}

export function hasRole(
  claims: JwtClaims | null,
  roles: SystemRole[],
): boolean {
  if (!claims) return false
  return roles.includes(claims.role)
}
```

---

## Fase 6 — Seed: Primeiro Usuário Admin

```sql
-- supabase/seed.sql

-- 1. Criar usuário no Supabase Auth via função auxiliar
-- (executar via Supabase Dashboard → SQL Editor, ou via script)

-- Inserir o perfil após criar o usuário manualmente no Dashboard → Auth → Users
INSERT INTO backoffice_users (id, role, full_name)
VALUES (
  'UUID_DO_USUARIO_CRIADO_NO_DASHBOARD',
  'super_admin',
  'Admin Vello'
);
```

> O usuário é criado primeiro em: Dashboard → Authentication → Users → Add User.
> Depois o `id` gerado é usado no INSERT acima.

---

## Fase 7 — Types do Banco

### 7.1 Criar placeholder em `packages/database`

```typescript
// packages/database/src/types.ts
// Gerado automaticamente pelo Supabase CLI — não editar manualmente
// Regenerar com: pnpm db:types

export type Database = {
  public: {
    Tables: {}
    Views: {}
    Functions: {}
    Enums: {}
  }
}
```

### 7.2 Script no turbo.json

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
// turbo.json — adicionar task
{
  "tasks": {
    "db:types": {
      "cache": false
    }
  }
}
```

```json
// package.json raiz — adicionar script
{
  "scripts": {
    "db:types": "turbo db:types"
  }
}
```

---

## Fase 8 — Página de Sign-In

> Preserva o padrão existente do projeto: rota `(public)/sign-in`, hook `useFormState`
> customizado, componentes `Field/FieldError/FieldGroup/FieldLabel` próprios.
> Apenas a camada de transporte muda: de `ky` + cookie manual para Supabase Auth.

### Estrutura de arquivos

```
apps/admin/src/app/(public)/sign-in/
├── page.tsx           ← sem alteração
├── sign-in-form.tsx   ← sem alteração
└── actions.ts         ← APENAS ESTE ARQUIVO MUDA
```

---

### `page.tsx` — sem alteração

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

### `sign-in-form.tsx` — sem alteração

O componente permanece exatamente como está. Ele não conhece o mecanismo de auth —
apenas consome a action via `useFormState` e renderiza erros.

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

### `actions.ts` — substituição completa

- Use `createClient()` do Supabase server
- O Supabase gerencia a sessão via cookies automaticamente (via `@supabase/ssr`)
- Mantém o shape de retorno `{ success, message, errors }` que o `useFormState` espera

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
    // Não expor detalhes técnicos do Supabase ao usuário
    return {
      success: false,
      message: 'E-mail ou senha incorretos.',
      errors: null,
    }
  }

  // Supabase @supabase/ssr gerencia os cookies de sessão automaticamente.
  // Não é necessário setar cookie manualmente.
  return { success: true, message: null, errors: null }
}
```

> **Por que não há `redirect()` na action?**
> O `useFormState` do seu hook detecta `success: true` e executa o callback
> `() => router.push('/')` no cliente. O redirect acontece no lado do cliente,
> não na Server Action — isso é o comportamento correto para o padrão que você usa.

---

### Atualizar proxy — rota correta

O proxy precisa apontar para `/sign-in`:

```typescript
// apps/admin/src/proxy.ts

const isAuthRoute = request.nextUrl.pathname.startsWith('/sign-in')

// Redireciona para sign-in se não autenticado
if (!user && isProtectedRoute) {
  const url = request.nextUrl.clone()
  url.pathname = '/sign-in'
  return NextResponse.redirect(url)
}

// Redireciona para dashboard se já autenticado
if (user && isAuthRoute) {
  const url = request.nextUrl.clone()
  url.pathname = '/'
  return NextResponse.redirect(url)
}
```

---

## Ordem de Execução para o Claude Code

```
Fase 1  → supabase link
Fase 2  → .env.local + packages/env/src/admin.ts
Fase 3  → src/lib/supabase/client.ts + server.ts + service.ts
Fase 4  → src/middleware.ts (rota: /sign-in, redirect: /)
Fase 5  → migration backoffice_users + Edge Function + configurar hook no dashboard
Fase 6  → seed (manual no dashboard)
Fase 7  → packages/database placeholder + pnpm db:types
Fase 8  → actions.ts de sign-in (substituir ky por Supabase) + sign-out-button.tsx
```

> `page.tsx` e `sign-in-form.tsx` não precisam de alteração — preservar como estão.

---

## Critérios de Conclusão

- [x] `supabase status` retorna projeto linkado
- [x] `.env.local` preenchido, `.env.example` commitado
- [x] `packages/env/src/admin.ts` validando as variáveis (publishable/secret key)
- [x] `src/lib/supabase/client.ts`, `server.ts` e `service.ts` criados
- [x] `proxy.ts` redirecionando para `/sign-in` sem auth, para `/` com auth
- [x] `middleware.ts` re-exporta `proxy` e `config`
- [x] Migration `backoffice_users` aplicada: `supabase db push`
- [x] Edge Function `custom-access-token` deployada
- [ ] Hook "Custom Access Token" configurado no Dashboard (Authentication → Hooks)
- [ ] Usuário super_admin criado via dashboard + INSERT em `backoffice_users`
- [ ] Login funciona: `success: true` → `router.push('/')` via `useFormState`
- [ ] JWT do usuário contém `role: 'super_admin'` e `tenant_id: null`
- [x] `pnpm db:types` gera os types em `packages/database/src/types.ts`
- [ ] Acesso direto a `/` sem login redireciona para `/sign-in`
- [x] Erros de auth retornam `{ success: false, message, errors: null }` — sem detalhes técnicos

# Console App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o app `apps/console` completo com autenticação segura por tenant (e-mail + senha), branding dinâmico carregado no servidor, middleware de resolução de tenant por subdomínio e domínio customizado, isolamento de sessão em relação ao admin, e três módulos: Dashboard (blank), Produtos e Configuração da Loja.

**Architecture:** Middleware Edge resolve o tenant a partir do `Host` header (subdomínio Vello ou custom_domain), injeta `x-tenant-id` e `x-tenant-slug` como headers internos, valida sessão Supabase e role via `@vello/auth`. Layout público busca branding no servidor via service role. Toda query de dados acontece em Server Components ou Server Actions — nenhuma query no cliente.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui, @supabase/ssr, @vello/auth, geist, next-themes, sonner, zod.

**Spec de referência:** `docs/superpowers/specs/2026-04-09-console-app-design.md`

> **Nota pós-execução (2026-04-09):** O `storageKey` fixo `'vello-console-auth'` referenciado neste plano foi substituído por um `storageKey` dinâmico por `tenant_id` (UUID): `getStorageKey(tenantId)` → `'vello-console-auth-{tenantId}'`. Isso isola sessões entre tenants, não apenas entre apps. Ver `lib/supabase/storage-key.ts` e a Seção 3 da spec.

---

## Mapa de Arquivos

### Criar
```
supabase/migrations/20260409000000_create_tenant_users.sql
packages/env/src/console.ts                    (atualizar)
apps/console/src/lib/supabase/server.ts        (atualizar — storageKey)
apps/console/src/lib/supabase/service.ts       (sem mudança — já ok)
apps/console/src/lib/supabase/client.ts        (criar)
apps/console/src/lib/supabase/proxy.ts         (criar)
apps/console/src/lib/utils.ts                  (criar)
apps/console/src/proxy.ts                      (criar — middleware)
apps/console/src/app/globals.css               (atualizar)
apps/console/src/app/providers.tsx             (criar)
apps/console/src/app/layout.tsx                (atualizar)
apps/console/src/assets/logo.svg               (copiar do admin)
apps/console/src/hooks/use-form-state.ts       (criar)
apps/console/src/hooks/use-mobile.ts           (copiar do admin)
apps/console/src/http/sign-out.ts              (criar)
apps/console/src/components/ui/alert.tsx       (copiar do admin)
apps/console/src/components/ui/avatar.tsx      (copiar do admin)
apps/console/src/components/ui/button.tsx      (copiar do admin)
apps/console/src/components/ui/dropdown-menu.tsx  (copiar do admin)
apps/console/src/components/ui/field.tsx       (copiar do admin)
apps/console/src/components/ui/input.tsx       (copiar do admin)
apps/console/src/components/ui/label.tsx       (copiar do admin)
apps/console/src/components/ui/separator.tsx   (copiar do admin)
apps/console/src/components/ui/sheet.tsx       (copiar do admin)
apps/console/src/components/ui/sidebar.tsx     (copiar do admin)
apps/console/src/components/ui/skeleton.tsx    (copiar do admin)
apps/console/src/components/ui/sonner.tsx      (copiar do admin)
apps/console/src/components/ui/switch.tsx      (copiar do admin)
apps/console/src/components/ui/tooltip.tsx     (copiar do admin)
apps/console/src/components/header.tsx         (criar)
apps/console/src/components/sidebar/index.tsx  (criar)
apps/console/src/components/sidebar/nav-main.tsx  (criar)
apps/console/src/components/sidebar/nav-link.tsx  (copiar do admin)
apps/console/src/components/sidebar/nav-user.tsx  (criar)
apps/console/src/components/sidebar/profile-button.tsx  (criar)
apps/console/src/app/(public)/layout.tsx       (criar)
apps/console/src/app/(public)/sign-in/page.tsx (criar)
apps/console/src/app/(public)/sign-in/actions.ts (criar)
apps/console/src/app/(public)/sign-in/sign-in-form.tsx (criar)
apps/console/src/app/(private)/layout.tsx      (criar)
apps/console/src/app/(private)/(dashboard)/page.tsx (criar)
apps/console/src/app/(private)/products/page.tsx (criar)
apps/console/src/app/(private)/products/queries.ts (criar)
apps/console/src/app/(private)/products/actions.ts (criar)
apps/console/src/app/(private)/products/_components/product-list.tsx (criar)
apps/console/src/app/(private)/store-settings/page.tsx (criar)
apps/console/src/app/(private)/store-settings/queries.ts (criar)
apps/console/src/app/(private)/store-settings/actions.ts (criar)
apps/console/src/app/(private)/store-settings/_components/store-settings-form.tsx (criar)
```

### Deletar
```
apps/console/src/app/page.tsx   (conflita com (private)/(dashboard)/page.tsx)
```

---

## Task 1: Migration — `tenant_users`

**Files:**
- Create: `supabase/migrations/20260409000000_create_tenant_users.sql`

- [ ] **Criar o arquivo de migration**

```sql
-- supabase/migrations/20260409000000_create_tenant_users.sql
-- Tabela de usuários do console (tenants).
-- Referenciada pelo auth hook (create_auth_hook.sql) — deve existir antes de ativar tenants.

CREATE TYPE tenant_role AS ENUM ('tenant_admin', 'tenant_operator');

CREATE TABLE tenant_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role       tenant_role NOT NULL DEFAULT 'tenant_admin',
  full_name  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_tenant_users
  BEFORE UPDATE ON tenant_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Backoffice gerencia todos os tenant_users (necessário para F3 — Ativar Tenant)
CREATE POLICY "backoffice_full_access" ON tenant_users
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Tenant vê apenas usuários do seu próprio tenant
CREATE POLICY "tenant_read" ON tenant_users
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Apenas tenant_admin pode gerenciar usuários do seu tenant
CREATE POLICY "tenant_admin_write" ON tenant_users
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') = 'tenant_admin'
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') = 'tenant_admin'
  );
```

- [ ] **Aplicar a migration**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
supabase db push
```

Esperado: migration aplicada sem erros.

- [ ] **Regenerar types do banco**

```bash
pnpm db:types
```

- [ ] **Commit**

```bash
git add supabase/migrations/20260409000000_create_tenant_users.sql packages/database/src/types.ts
git commit -m "feat(supabase): cria tabela tenant_users com RLS por role e tenant"
```

---

## Task 2: Pacotes — `package.json` e `packages/env`

**Files:**
- Modify: `apps/console/package.json`
- Modify: `packages/env/src/console.ts`

- [ ] **Atualizar `packages/env/src/console.ts`** para adicionar `CONSOLE_BASE_DOMAIN`

```typescript
// packages/env/src/console.ts
import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'
import { sharedClient, sharedRuntimeEnv, sharedServer } from './shared'

export const env = createEnv({
  server: {
    ...sharedServer,
    CONSOLE_BASE_DOMAIN: z.string().min(1), // ex: vellofinance.com.br
    NODE_ENV: z.enum(['development', 'test', 'production']),
  },
  client: {
    ...sharedClient,
  },
  runtimeEnv: {
    ...sharedRuntimeEnv,
    CONSOLE_BASE_DOMAIN: process.env.CONSOLE_BASE_DOMAIN,
    NODE_ENV: process.env.NODE_ENV,
  },
  emptyStringAsUndefined: true,
})
```

- [ ] **Substituir `apps/console/package.json`** pelo conteúdo alinhado ao admin

```json
{
  "name": "console",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "pnpm env:load next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "env:load": "dotenv -e ../../.env --"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.2.8",
    "@supabase/ssr": "^0.10.0",
    "@supabase/supabase-js": "^2.101.1",
    "@vello/auth": "workspace:*",
    "@vello/database": "workspace:*",
    "@vello/env": "workspace:*",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "geist": "^1.7.0",
    "lucide-react": "^1.7.0",
    "next": "16.2.2",
    "next-themes": "^0.4.6",
    "radix-ui": "^1.4.3",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "shadcn": "^4.1.2",
    "sonner": "^2.0.7",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.2",
    "@types/node": "^20.19.37",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vello/biome-config": "workspace:*",
    "@vello/typescript-config": "workspace:*",
    "dotenv-cli": "^11.0.0",
    "tailwindcss": "^4.2.2",
    "typescript": "^5.9.3"
  },
  "biome": {
    "extends": "@vello/biome-config/base"
  },
  "tsconfig": {
    "extends": "@vello/typescript-config/library"
  }
}
```

- [ ] **Instalar dependências**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm install
```

Esperado: sem erros. `node_modules` atualizado com geist, shadcn, lucide-react, etc.

- [ ] **Adicionar `CONSOLE_BASE_DOMAIN` ao `.env`** (se não existir)

```bash
# Verificar se já existe
grep CONSOLE_BASE_DOMAIN .env
```

Se não existir, adicionar ao `.env`:
```
CONSOLE_BASE_DOMAIN=vellofinance.com.br
```

- [ ] **Commit**

```bash
git add packages/env/src/console.ts apps/console/package.json .env
git commit -m "feat(console): atualiza package.json e env com deps e CONSOLE_BASE_DOMAIN"
```

---

## Task 3: Clientes Supabase + utils

**Files:**
- Modify: `apps/console/src/lib/supabase/server.ts`
- Create: `apps/console/src/lib/supabase/client.ts`
- Create: `apps/console/src/lib/supabase/proxy.ts`
- Create: `apps/console/src/lib/utils.ts`

- [ ] **Atualizar `lib/supabase/server.ts`** — adicionar `storageKey`

```typescript
// apps/console/src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@vello/database'
import { env } from '@vello/env/console'
import { cookies } from 'next/headers'

// Usar em: Server Components, Server Actions, Route Handlers.
// Este client respeita RLS — as queries são feitas sob a sessão do usuário autenticado.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { storageKey: 'vello-console-auth' },
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

- [ ] **Criar `lib/supabase/client.ts`** — browser client com storageKey

```typescript
// apps/console/src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@vello/database'
import { env } from '@vello/env/console'

// Uso permitido APENAS em Client Components para:
// - auth.getUser()   → verificar sessão ativa
// - auth.signOut()   → logout
// NUNCA usar supabase.from() aqui — toda query de dados é feita no servidor.
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { storageKey: 'vello-console-auth' } },
  )
}
```

- [ ] **Criar `lib/supabase/proxy.ts`** — helper de sessão para o middleware

```typescript
// apps/console/src/lib/supabase/proxy.ts
import { createServerClient } from '@supabase/ssr'
import { env } from '@vello/env/console'
import { type NextRequest, NextResponse } from 'next/server'

export async function updateSession(
  request: NextRequest,
): Promise<{ response: NextResponse; isAuthenticated: boolean; userId: string | null }> {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { storageKey: 'vello-console-auth' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value),
          )
        },
      },
    },
  )

  // IMPORTANTE: não inserir código entre createServerClient e getUser()
  const { data } = await supabase.auth.getUser()

  return {
    response: supabaseResponse,
    isAuthenticated: !!data?.user,
    userId: data?.user?.id ?? null,
  }
}
```

- [ ] **Criar `lib/utils.ts`**

```typescript
// apps/console/src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Commit**

```bash
git add apps/console/src/lib/
git commit -m "feat(console): configura clientes Supabase com storageKey isolado (vello-console-auth)"
```

---

## Task 4: Middleware — `src/proxy.ts`

**Files:**
- Create: `apps/console/src/proxy.ts`

O middleware resolve o tenant a partir do `Host` header, valida sessão, valida role via `@vello/auth` e injeta headers internos. Para custom_domain, usa fetch direto à API REST do Supabase (edge-compatible).

- [ ] **Criar `src/proxy.ts`**

```typescript
// apps/console/src/proxy.ts
import { getJwtClaims, hasTenantAccess } from '@vello/auth'
import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Rotas públicas e comportamento quando o usuário já está autenticado.
const publicRoutes = [
  { path: '/sign-in', whenAuthenticated: 'redirect' as const },
  { path: '/forgot-password', whenAuthenticated: 'redirect' as const },
  { path: '/reset-password', whenAuthenticated: 'next' as const },
]

function getRouteType(pathname: string) {
  for (const { path, whenAuthenticated } of publicRoutes) {
    if (pathname === path || pathname.startsWith(`${path}/`)) {
      return { isPublic: true, whenAuthenticated }
    }
  }
  return { isPublic: false, whenAuthenticated: null }
}

// Resolve o tenant a partir do host.
// Subdomínio → slug; custom_domain → busca no banco via fetch REST.
async function resolveTenant(
  host: string,
): Promise<{ id: string; slug: string; status: string } | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SECRET_KEY
  const baseDomain = process.env.CONSOLE_BASE_DOMAIN ?? 'vellofinance.com.br'

  if (!supabaseUrl || !serviceKey) return null

  let filter: string

  if (host.endsWith(`.${baseDomain}`)) {
    // Subdomínio: slug.vellofinance.com.br → slug=slug
    const slug = host.slice(0, host.length - baseDomain.length - 1)
    if (!slug) return null
    filter = `slug=eq.${slug}`
  } else {
    // Domínio customizado → busca por custom_domain
    filter = `custom_domain=eq.${host}`
  }

  const url = `${supabaseUrl}/rest/v1/tenants?select=id,slug,status&${filter}&limit=1`

  const response = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    cache: 'no-store',
  })

  if (!response.ok) return null
  const data = (await response.json()) as Array<{ id: string; slug: string; status: string }>
  return data[0] ?? null
}

export async function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  // Ignorar API routes e assets estáticos (coberto pelo matcher, mas por precaução)
  if (pathname.startsWith('/api/') || pathname.startsWith('/_next/')) {
    return NextResponse.next({ request })
  }

  // 1. Resolver tenant a partir do host
  const tenant = await resolveTenant(host)

  if (!tenant) {
    // Tenant não encontrado — retornar 404 simples
    return new NextResponse('Tenant não encontrado', { status: 404 })
  }

  if (tenant.status !== 'active') {
    // Tenant inativo/suspenso — retornar 503
    return new NextResponse('Este espaço está temporariamente indisponível', { status: 503 })
  }

  // 2. Renovar sessão Supabase e obter userId
  const { response, isAuthenticated, userId } = await updateSession(request)

  // Copiar headers da resposta do updateSession para nossa resposta base
  const newResponse = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  // Injetar headers internos (não expostos ao browser pelo Next.js)
  newResponse.headers.set('x-tenant-id', tenant.id)
  newResponse.headers.set('x-tenant-slug', tenant.slug)

  // Propagar cookies da sessão do updateSession
  response.cookies.getAll().forEach((cookie) => {
    newResponse.cookies.set(cookie)
  })

  const { isPublic, whenAuthenticated } = getRouteType(pathname)

  // 3. Rota privada sem autenticação → redirect para sign-in
  if (!isAuthenticated && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/sign-in'
    return NextResponse.redirect(url)
  }

  // 4. Usuário autenticado em rota pública (ex: /sign-in) → redirect para dashboard
  if (isAuthenticated && isPublic && whenAuthenticated === 'redirect') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // 5. Validar role do usuário autenticado via @vello/auth (sem hardcode de arrays)
  if (isAuthenticated && userId) {
    // Buscar app_metadata do usuário para extrair claims
    const userUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${userId}`
    const userResponse = await fetch(userUrl, {
      headers: {
        apikey: process.env.SUPABASE_SECRET_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY!}`,
      },
      cache: 'no-store',
    })

    if (userResponse.ok) {
      const userData = (await userResponse.json()) as { app_metadata?: Record<string, unknown> }
      const claims = getJwtClaims(userData)

      // Role não é de tenant → expulsar (pode ser usuário do backoffice tentando acessar console)
      if (!claims || !hasTenantAccess(claims.user_role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        // Sinaliza que a sessão deve ser invalidada na próxima renderização
        newResponse.headers.set('x-force-signout', '1')
        return NextResponse.redirect(url)
      }

      // tenant_id no JWT deve bater com o tenant resolvido pelo host
      if (claims.tenant_id !== tenant.id) {
        const url = request.nextUrl.clone()
        url.pathname = '/sign-in'
        newResponse.headers.set('x-force-signout', '1')
        return NextResponse.redirect(url)
      }
    }
  }

  return newResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

> **Nota de segurança:** O header `x-force-signout` sinaliza para o layout do console que deve chamar `signOut()` na próxima renderização. Isso é necessário porque o middleware não pode chamar `signOut()` diretamente (a operação de cookie precisa acontecer numa requisição subsequente). Na prática, o redirect para `/sign-in` + sessão inválida já impede acesso. O signOut limpa os cookies de forma explícita.

- [ ] **Verificar que o arquivo está em `src/proxy.ts`** (mesma convenção do admin)

```bash
ls apps/console/src/proxy.ts
```

- [ ] **Commit**

```bash
git add apps/console/src/proxy.ts
git commit -m "feat(console): middleware de resolução de tenant com validação de role via @vello/auth"
```

---

## Task 5: `globals.css` + `providers.tsx` + root `layout.tsx`

**Files:**
- Modify: `apps/console/src/app/globals.css`
- Create: `apps/console/src/app/providers.tsx`
- Modify: `apps/console/src/app/layout.tsx`

- [ ] **Atualizar `globals.css`** — adicionar imports, dark mode e tokens de layout

```css
/* apps/console/src/app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  /* Tipografia */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);

  /* shadcn tokens → Tailwind utilities */
  --color-background:           var(--background);
  --color-foreground:           var(--foreground);
  --color-card:                 var(--card);
  --color-card-foreground:      var(--card-foreground);
  --color-popover:              var(--popover);
  --color-popover-foreground:   var(--popover-foreground);
  --color-primary:              var(--primary);
  --color-primary-foreground:   var(--primary-foreground);
  --color-secondary:            var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted:                var(--muted);
  --color-muted-foreground:     var(--muted-foreground);
  --color-accent:               var(--accent);
  --color-accent-foreground:    var(--accent-foreground);
  --color-destructive:          var(--destructive);
  --color-border:               var(--border);
  --color-input:                var(--input);
  --color-ring:                 var(--ring);

  /* Sidebar */
  --color-sidebar:                    var(--sidebar);
  --color-sidebar-foreground:         var(--sidebar-foreground);
  --color-sidebar-primary:            var(--sidebar-primary);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-accent:             var(--sidebar-accent);
  --color-sidebar-accent-foreground:  var(--sidebar-accent-foreground);
  --color-sidebar-border:             var(--sidebar-border);
  --color-sidebar-ring:               var(--sidebar-ring);

  /* Border radius */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Layout */
  --color-page-bg: var(--page-bg);
  --width-sidebar: var(--sidebar-width);
  --height-header: var(--header-height);

  /* Tipografia extra */
  --text-2xs: 0.625rem;
}

:root {
  --background:         oklch(1 0 0);
  --foreground:         oklch(0.193 0.055 264.0);
  --card:               oklch(1 0 0);
  --card-foreground:    oklch(0.193 0.055 264.0);
  --popover:            oklch(1 0 0);
  --popover-foreground: oklch(0.193 0.055 264.0);
  --primary:            oklch(0.478 0.152 260.5);
  --primary-foreground: oklch(1 0 0);
  --secondary:          oklch(0.961 0.009 264.0);
  --secondary-foreground: oklch(0.193 0.055 264.0);
  --muted:              oklch(0.961 0.009 264.0);
  --muted-foreground:   oklch(0.551 0.025 264.0);
  --accent:             oklch(0.478 0.152 260.5);
  --accent-foreground:  oklch(1 0 0);
  --destructive:        oklch(0.577 0.245 27.325);
  --border:             oklch(0.910 0.012 264.0);
  --input:              oklch(0.910 0.012 264.0);
  --ring:               oklch(0.478 0.152 260.5);
  --radius: 0.5rem;
  --sidebar:                    oklch(1 0 0);
  --sidebar-foreground:         oklch(0.193 0.055 264.0);
  --sidebar-primary:            oklch(0.478 0.152 260.5);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent:             oklch(0.958 0.023 261.0);
  --sidebar-accent-foreground:  oklch(0.478 0.152 260.5);
  --sidebar-border:             oklch(0.910 0.012 264.0);
  --sidebar-ring:               oklch(0.478 0.152 260.5);
  --sidebar-width:   220px;
  --header-height:   52px;
  --page-bg:         oklch(0.961 0.009 264.0);
}

.dark {
  --background:         oklch(0.095 0.008 264.0);
  --foreground:         oklch(0.960 0 0);
  --card:               oklch(0.170 0.006 264.0);
  --card-foreground:    oklch(0.960 0 0);
  --popover:            oklch(0.170 0.006 264.0);
  --popover-foreground: oklch(0.960 0 0);
  --primary:            oklch(0.570 0.141 258.8);
  --primary-foreground: oklch(1 0 0);
  --secondary:          oklch(0.240 0.005 264.0);
  --secondary-foreground: oklch(0.960 0 0);
  --muted:              oklch(0.240 0.005 264.0);
  --muted-foreground:   oklch(0.650 0.008 264.0);
  --accent:             oklch(0.240 0.005 264.0);
  --accent-foreground:  oklch(0.960 0 0);
  --destructive:        oklch(0.370 0.130 27.0);
  --border:             oklch(0.240 0.005 264.0);
  --input:              oklch(0.240 0.005 264.0);
  --ring:               oklch(0.570 0.141 258.8);
  --sidebar:                    oklch(0.170 0.006 264.0);
  --sidebar-foreground:         oklch(0.960 0 0);
  --sidebar-primary:            oklch(0.570 0.141 258.8);
  --sidebar-primary-foreground: oklch(1 0 0);
  --sidebar-accent:             oklch(0.180 0.030 258.0);
  --sidebar-accent-foreground:  oklch(0.650 0.110 259.0);
  --sidebar-border:             oklch(0.240 0.005 264.0);
  --sidebar-ring:               oklch(0.570 0.141 258.8);
  --page-bg:            oklch(0.095 0.008 264.0);
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
```

- [ ] **Criar `providers.tsx`**

```typescript
// apps/console/src/app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>{children}</TooltipProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Atualizar `app/layout.tsx`**

```typescript
// apps/console/src/app/layout.tsx
import './globals.css'

import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import type { ReactNode } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { TenantThemeLoader } from '@/components/tenant-theme-loader'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: {
    template: '%s | Vello Console',
    default: 'Vello Console',
  },
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const tenantSlug = headerStore.get('x-tenant-slug') ?? 'default'

  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      data-tenant-theme={tenantSlug}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <TenantThemeLoader tenantSlug={tenantSlug} />
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Commit**

```bash
git add apps/console/src/app/globals.css apps/console/src/app/providers.tsx apps/console/src/app/layout.tsx
git commit -m "feat(console): configura globals.css com dark mode, providers e root layout com geist"
```

---

## Task 6: UI primitives + hooks + http + assets

**Files:** vários — cópia exata do admin

- [ ] **Criar diretórios necessários**

```bash
mkdir -p apps/console/src/components/ui
mkdir -p apps/console/src/hooks
mkdir -p apps/console/src/http
mkdir -p apps/console/src/assets
```

- [ ] **Copiar UI components do admin** (arquivos idênticos — sem modificações)

```bash
ADMIN=apps/admin/src/components/ui
CONSOLE=apps/console/src/components/ui

cp $ADMIN/alert.tsx $CONSOLE/alert.tsx
cp $ADMIN/avatar.tsx $CONSOLE/avatar.tsx
cp $ADMIN/button.tsx $CONSOLE/button.tsx
cp $ADMIN/dropdown-menu.tsx $CONSOLE/dropdown-menu.tsx
cp $ADMIN/field.tsx $CONSOLE/field.tsx
cp $ADMIN/input.tsx $CONSOLE/input.tsx
cp $ADMIN/label.tsx $CONSOLE/label.tsx
cp $ADMIN/separator.tsx $CONSOLE/separator.tsx
cp $ADMIN/sheet.tsx $CONSOLE/sheet.tsx
cp $ADMIN/sidebar.tsx $CONSOLE/sidebar.tsx
cp $ADMIN/skeleton.tsx $CONSOLE/skeleton.tsx
cp $ADMIN/sonner.tsx $CONSOLE/sonner.tsx
cp $ADMIN/switch.tsx $CONSOLE/switch.tsx
cp $ADMIN/tooltip.tsx $CONSOLE/tooltip.tsx
```

- [ ] **Copiar hooks e assets**

```bash
cp apps/admin/src/hooks/use-form-state.ts apps/console/src/hooks/use-form-state.ts
cp apps/admin/src/hooks/use-mobile.ts apps/console/src/hooks/use-mobile.ts
cp apps/admin/src/assets/logo.svg apps/console/src/assets/logo.svg
```

- [ ] **Criar `http/sign-out.ts`**

```typescript
// apps/console/src/http/sign-out.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/sign-in')
}
```

- [ ] **Verificar que os arquivos copiados não têm imports quebrados**

Os arquivos copiados importam de `@/lib/utils`, `@/components/ui/*` — esses caminhos são idênticos no console. Verificar que `utils.ts` existe:

```bash
ls apps/console/src/lib/utils.ts
```

- [ ] **Commit**

```bash
git add apps/console/src/components/ui/ apps/console/src/hooks/ apps/console/src/http/ apps/console/src/assets/
git commit -m "feat(console): adiciona UI primitivos, hooks e assets (cópia do admin)"
```

---

## Task 7: Layout público + página de sign-in

**Files:**
- Create: `apps/console/src/app/(public)/layout.tsx`
- Create: `apps/console/src/app/(public)/sign-in/page.tsx`
- Create: `apps/console/src/app/(public)/sign-in/actions.ts`
- Create: `apps/console/src/app/(public)/sign-in/sign-in-form.tsx`

- [ ] **Criar `(public)/layout.tsx`** — split 40/60 com branding do tenant (server-side)

```typescript
// apps/console/src/app/(public)/layout.tsx
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Image from 'next/image'
import type { ReactNode } from 'react'

import logo from '@/assets/logo.svg'
import { createServiceClient } from '@/lib/supabase/service'

async function getTenantBranding(tenantId: string | null) {
  if (!tenantId) return null
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('logo_url, favicon_url, auth_bg_image_url, company_display_name, custom_css')
    .eq('tenant_id', tenantId)
    .single()
  return data
}

export async function generateMetadata(): Promise<Metadata> {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  const branding = await getTenantBranding(tenantId)

  return {
    title: branding?.company_display_name
      ? { template: `%s | ${branding.company_display_name}`, default: branding.company_display_name }
      : { template: '%s | Vello Console', default: 'Vello Console' },
    icons: branding?.favicon_url ? { icon: branding.favicon_url } : undefined,
  }
}

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  const branding = await getTenantBranding(tenantId)

  // Extrair primary/secondary do custom_css JSONB para o gradiente fallback
  const cssTokens = ((branding?.custom_css ?? {}) as Record<string, string>)
  const primary = cssTokens['primary'] ?? 'oklch(0.478 0.152 260.5)'
  const secondary = cssTokens['secondary'] ?? 'oklch(0.305 0.093 255.5)'

  return (
    <div className="grid min-h-svh lg:grid-cols-[40%_60%]">
      {/* Painel esquerdo — formulário */}
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-zinc-900">
        <div>
          {branding?.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logo_url}
              alt="Logo"
              className="h-8 w-auto"
            />
          ) : (
            <Image src={logo} alt="Vello" height={32} loading="eager" />
          )}
        </div>
        <div className="flex flex-1 items-center justify-center">
          {children}
        </div>
      </div>

      {/* Painel direito — imagem ou gradiente */}
      <div className="relative hidden lg:block">
        {branding?.auth_bg_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={branding.auth_bg_image_url}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${primary}, ${secondary})` }}
          />
        )}
      </div>
    </div>
  )
}
```

- [ ] **Criar `sign-in/actions.ts`**

```typescript
// apps/console/src/app/(public)/sign-in/actions.ts
'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const signInSchema = z.object({
  email: z.email({ message: 'Por favor, informe um e-mail válido.' }),
  password: z.string().min(1, { message: 'Por favor, informe sua senha.' }),
})

export async function signInWithEmailAndPassword(data: FormData) {
  const result = signInSchema.safeParse(Object.fromEntries(data))

  if (!result.success) {
    return {
      success: false,
      message: null,
      errors: z.flattenError(result.error).fieldErrors,
    }
  }

  const { email, password } = result.data
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return {
      success: false,
      message: 'E-mail ou senha incorretos.',
      errors: null,
    }
  }

  return { success: true, message: null, errors: null }
}
```

- [ ] **Criar `sign-in/sign-in-form.tsx`**

```typescript
// apps/console/src/app/(public)/sign-in/sign-in-form.tsx
'use client'

import { AlertCircleIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'
import { signInWithEmailAndPassword } from './actions'

export function SignInForm({ ...props }: React.ComponentProps<'form'>) {
  const router = useRouter()

  const [{ errors, message, success }, handleSubmit, isPending] = useFormState(
    signInWithEmailAndPassword,
    () => router.push('/'),
  )

  return (
    <form onSubmit={handleSubmit} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold text-white">Acesse sua conta</h1>
          <p className="text-zinc-400 text-sm text-balance">
            Insira seus dados abaixo para acessar sua conta
          </p>
        </div>

        {success === false && message && (
          <Alert variant="destructive" className="border-red-200 bg-red-50">
            <AlertCircleIcon />
            <AlertTitle>Erro ao entrar!</AlertTitle>
            <AlertDescription className="text-xs">{message}</AlertDescription>
          </Alert>
        )}

        <Field data-invalid={!!errors?.email}>
          <FieldLabel htmlFor="email" className="text-zinc-300">E-mail</FieldLabel>
          <Input
            id="email"
            type="email"
            name="email"
            aria-invalid={!!errors?.email}
            className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
          />
          <FieldError errors={errors?.email} />
        </Field>

        <Field data-invalid={!!errors?.password}>
          <FieldLabel htmlFor="password" className="text-zinc-300">Senha</FieldLabel>
          <Input
            id="password"
            type="password"
            name="password"
            aria-invalid={!!errors?.password}
            className="bg-zinc-800 border-zinc-700 text-white"
          />
          <FieldError errors={errors?.password} />
        </Field>

        <Field>
          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Entrar'}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
```

- [ ] **Criar `sign-in/page.tsx`**

```typescript
// apps/console/src/app/(public)/sign-in/page.tsx
import type { Metadata } from 'next'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Entrar' }

export default function SignInPage() {
  return <SignInForm className="w-full max-w-sm" />
}
```

- [ ] **Commit**

```bash
git add apps/console/src/app/\(public\)/
git commit -m "feat(console): layout público com branding dinâmico e página de sign-in"
```

---

## Task 8: Sidebar + Header + Private layout

**Files:**
- Create: `apps/console/src/components/sidebar/index.tsx`
- Create: `apps/console/src/components/sidebar/nav-main.tsx`
- Copy: `apps/console/src/components/sidebar/nav-link.tsx`
- Create: `apps/console/src/components/sidebar/nav-user.tsx`
- Create: `apps/console/src/components/sidebar/profile-button.tsx`
- Create: `apps/console/src/components/header.tsx`
- Create: `apps/console/src/app/(private)/layout.tsx`

- [ ] **Criar diretório da sidebar**

```bash
mkdir -p apps/console/src/components/sidebar
```

- [ ] **Copiar `nav-link.tsx`** (idêntico ao admin)

```bash
cp apps/admin/src/components/sidebar/nav-link.tsx apps/console/src/components/sidebar/nav-link.tsx
```

- [ ] **Criar `sidebar/index.tsx`** — logo do tenant via RLS ou fallback Vello

```typescript
// apps/console/src/components/sidebar/index.tsx
import Image from 'next/image'

import logo from '@/assets/logo.svg'
import { createClient } from '@/lib/supabase/server'

import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { NavMain } from './nav-main'
import { NavUser } from './nav-user'

interface SidebarProps extends React.ComponentProps<typeof SidebarPrimitive> {}

export async function Sidebar({ ...props }: SidebarProps) {
  // RLS filtra automaticamente para o branding do tenant autenticado
  const supabase = await createClient()
  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('logo_url')
    .single()

  return (
    <SidebarPrimitive collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {branding?.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logo_url} alt="Logo" className="h-6 w-auto" />
            ) : (
              <Image src={logo} alt="Vello" height={24} loading="eager" />
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="pt-6">
        <NavMain />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </SidebarPrimitive>
  )
}
```

- [ ] **Criar `sidebar/nav-main.tsx`** — itens do console

```typescript
// apps/console/src/components/sidebar/nav-main.tsx
import { LayoutDashboard, Package, Settings } from 'lucide-react'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

import { NavLink } from './nav-link'

export function NavMain() {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <NavLink href="/" icon={<LayoutDashboard className="size-4" />} label="Dashboard" />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <NavLink href="/products" icon={<Package className="size-4" />} label="Produtos" />
          </SidebarMenuItem>

          <SidebarMenuItem>
            <NavLink href="/store-settings" icon={<Settings className="size-4" />} label="Configuração da Loja" />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
```

- [ ] **Criar `sidebar/nav-user.tsx`** — busca em `tenant_users`

```typescript
// apps/console/src/components/sidebar/nav-user.tsx
import { SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar'
import { createClient } from '@/lib/supabase/server'
import { ProfileButton } from './profile-button'

export async function NavUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let name = 'Usuário'
  let email = ''

  if (user) {
    const { data: profile } = await supabase
      .from('tenant_users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    name = profile?.full_name ?? 'Usuário'
    email = user.email ?? ''
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <ProfileButton user={{ name, email }} />
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
```

- [ ] **Criar `sidebar/profile-button.tsx`** — sem ThemeSwitcher (diferente do admin)

```typescript
// apps/console/src/components/sidebar/profile-button.tsx
'use client'

import { EllipsisVertical, LogOut } from 'lucide-react'
import { useTransition } from 'react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SidebarMenuButton, useSidebar } from '@/components/ui/sidebar'
import { signOut } from '@/http/sign-out'

interface ProfileButtonProps {
  user: { name: string; email: string }
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part: string) => part[0].toUpperCase())
    .join('')
}

export function ProfileButton({ user }: ProfileButtonProps) {
  const { isMobile } = useSidebar()
  const [isPending, startTransition] = useTransition()

  function handleSignOut() {
    startTransition(() => signOut())
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <Avatar className="h-8 w-8 rounded-lg grayscale">
            <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{user.name}</span>
            <span className="text-muted-foreground truncate text-xs">{user.email}</span>
          </div>
          <EllipsisVertical className="ml-auto size-4" />
        </SidebarMenuButton>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
        side={isMobile ? 'bottom' : 'right'}
        align="end"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg">{initials(user.name)}</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user.name}</span>
              <span className="text-muted-foreground truncate text-xs">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={handleSignOut}
            disabled={isPending}
            variant="destructive"
          >
            <LogOut className="size-4" />
            {isPending ? 'Saindo...' : 'Sair'}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Criar `components/header.tsx`**

```typescript
// apps/console/src/components/header.tsx
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'

export function Header() {
  return (
    <header className="flex h-header shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-header">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="my-2 data-[orientation=vertical]:h-4"
        />
      </div>
    </header>
  )
}
```

- [ ] **Criar `(private)/layout.tsx`**

```typescript
// apps/console/src/app/(private)/layout.tsx
import { Header } from '@/components/header'
import { Sidebar } from '@/components/sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <Sidebar variant="inset" />

      <SidebarInset className="border border-border">
        <Header />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 h-full">
              {children}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
```

- [ ] **Commit**

```bash
git add apps/console/src/components/ apps/console/src/app/\(private\)/layout.tsx
git commit -m "feat(console): sidebar com logo do tenant, nav items, header e layout privado"
```

---

## Task 9: Dashboard (em branco) + remoção do page.tsx raiz

**Files:**
- Create: `apps/console/src/app/(private)/(dashboard)/page.tsx`
- Delete: `apps/console/src/app/page.tsx`

- [ ] **Criar diretório e a página do dashboard**

```bash
mkdir -p apps/console/src/app/\(private\)/\(dashboard\)
```

```typescript
// apps/console/src/app/(private)/(dashboard)/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

export default function DashboardPage() {
  return (
    <div className="px-4 lg:px-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Em breve: métricas e resumos do seu negócio.
      </p>
    </div>
  )
}
```

- [ ] **Remover o `page.tsx` raiz** que conflita com `(dashboard)/page.tsx`

```bash
rm apps/console/src/app/page.tsx
```

- [ ] **Verificar build sem erros de rota duplicada**

```bash
cd apps/console && pnpm build 2>&1 | head -50
```

Esperado: build sem erros de rota conflitante.

- [ ] **Commit**

```bash
git add apps/console/src/app/\(private\)/\(dashboard\)/
git rm apps/console/src/app/page.tsx
git commit -m "feat(console): dashboard em branco, remove page.tsx raiz conflitante"
```

---

## Task 10: Módulo Produtos

**Files:**
- Create: `apps/console/src/app/(private)/products/page.tsx`
- Create: `apps/console/src/app/(private)/products/queries.ts`
- Create: `apps/console/src/app/(private)/products/actions.ts`
- Create: `apps/console/src/app/(private)/products/_components/product-list.tsx`

- [ ] **Criar `products/queries.ts`**

```typescript
// apps/console/src/app/(private)/products/queries.ts
import { createClient } from '@/lib/supabase/server'

export async function listTenantProducts() {
  const supabase = await createClient()

  // RLS filtra automaticamente para os produtos do tenant autenticado
  const { data, error } = await supabase
    .from('tenant_products')
    .select(`
      id,
      is_active,
      tenant_commission_pct,
      products (
        id,
        name,
        type,
        description,
        is_active
      )
    `)
    .order('created_at')

  if (error) throw error
  return data ?? []
}

export type TenantProductRow = Awaited<ReturnType<typeof listTenantProducts>>[number]
```

- [ ] **Criar `products/actions.ts`**

```typescript
// apps/console/src/app/(private)/products/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function toggleTenantProduct(id: string, isActive: boolean) {
  const supabase = await createClient()

  // RLS garante que o tenant só pode atualizar seus próprios registros
  const { error } = await supabase
    .from('tenant_products')
    .update({ is_active: isActive })
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/products')
  return { success: true, message: null, errors: null }
}
```

- [ ] **Criar `products/_components/product-list.tsx`**

```typescript
// apps/console/src/app/(private)/products/_components/product-list.tsx
'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'

import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import type { TenantProductRow } from '../queries'
import { toggleTenantProduct } from '../actions'

interface ProductListProps {
  products: TenantProductRow[]
}

export function ProductList({ products }: ProductListProps) {
  const [isPending, startTransition] = useTransition()

  function handleToggle(id: string, isActive: boolean) {
    startTransition(async () => {
      const result = await toggleTenantProduct(id, isActive)
      if (!result.success) {
        toast.error(result.message ?? 'Erro ao atualizar produto.')
      }
    })
  }

  if (products.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum produto disponível. Entre em contato com a Vello Finance para ativar produtos.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {products.map((tp) => {
        const product = tp.products
        if (!product) return null

        return (
          <div
            key={tp.id}
            className="flex items-center justify-between rounded-lg border bg-card p-4"
          >
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-sm">{product.name}</span>
              {product.description && (
                <span className="text-muted-foreground text-xs">{product.description}</span>
              )}
              <span className="text-muted-foreground text-xs">
                Sua comissão: {Number(tp.tenant_commission_pct).toFixed(4)}%
              </span>
            </div>

            <Switch
              checked={tp.is_active}
              onCheckedChange={(checked) => handleToggle(tp.id, checked)}
              disabled={isPending || !product.is_active}
              title={!product.is_active ? 'Produto indisponível' : undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Criar `products/page.tsx`**

```typescript
// apps/console/src/app/(private)/products/page.tsx
import type { Metadata } from 'next'
import { ProductList } from './_components/product-list'
import { listTenantProducts } from './queries'

export const metadata: Metadata = { title: 'Produtos' }

export default async function ProductsPage() {
  const products = await listTenantProducts()

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Produtos</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Ative ou desative os produtos disponíveis para sua loja.
        </p>
      </div>

      <ProductList products={products} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add apps/console/src/app/\(private\)/products/
git commit -m "feat(console): módulo de produtos com toggle de ativação via Server Action"
```

---

## Task 11: Módulo Configuração da Loja

**Files:**
- Create: `apps/console/src/app/(private)/store-settings/page.tsx`
- Create: `apps/console/src/app/(private)/store-settings/queries.ts`
- Create: `apps/console/src/app/(private)/store-settings/actions.ts`
- Create: `apps/console/src/app/(private)/store-settings/_components/store-settings-form.tsx`

- [ ] **Criar `store-settings/queries.ts`**

```typescript
// apps/console/src/app/(private)/store-settings/queries.ts
import { createClient } from '@/lib/supabase/server'

// RLS em tenant_branding filtra automaticamente para o branding do tenant autenticado
export async function getTenantBrandingSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('tenant_id, logo_url, favicon_url, base_color, theme_color')
    .single()
  return data
}

export type BrandingSettings = Awaited<ReturnType<typeof getTenantBrandingSettings>>
```

- [ ] **Criar `store-settings/actions.ts`**

```typescript
// apps/console/src/app/(private)/store-settings/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const settingsSchema = z.object({
  base_color: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
})

export async function updateStoreSettings(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>

  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const result = settingsSchema.safeParse(obj)
  if (!result.success) {
    return { success: false, message: 'Verifique os campos.', errors: null }
  }

  const supabase = await createClient()

  // Buscar tenant_id via RLS — retorna apenas o branding do tenant autenticado
  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('tenant_id')
    .single()

  if (!branding?.tenant_id) {
    return { success: false, message: 'Configurações não encontradas.', errors: null }
  }

  // Atualizar campos de cor
  const { error } = await supabase
    .from('tenant_branding')
    .update({
      ...(result.data.base_color !== null && { base_color: result.data.base_color }),
      ...(result.data.theme_color !== null && { theme_color: result.data.theme_color }),
    })
    .eq('tenant_id', branding.tenant_id)

  if (error) return { success: false, message: error.message, errors: null }

  // Upload de arquivos — apenas se um novo arquivo foi selecionado
  const serviceClient = createServiceClient()

  const uploads: Array<{
    field: string
    path: string
    maxSize: number
    urlField: string
    accept: string
  }> = [
    {
      field: 'logo',
      path: `${branding.tenant_id}/logo`,
      maxSize: 2 * 1024 * 1024,
      urlField: 'logo_url',
      accept: 'image/png,image/svg+xml,image/webp',
    },
    {
      field: 'favicon',
      path: `${branding.tenant_id}/favicon`,
      maxSize: 512 * 1024,
      urlField: 'favicon_url',
      accept: 'image/png,image/x-icon',
    },
  ]

  const uploadUpdates: Record<string, string> = {}

  for (const { field, path, maxSize, urlField } of uploads) {
    const file = data.get(field) as File | null
    if (!file || file.size === 0) continue
    if (file.size > maxSize) continue

    const buffer = await file.arrayBuffer()
    const { error: uploadError } = await serviceClient.storage
      .from('tenant-assets')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (!uploadError) {
      const {
        data: { publicUrl },
      } = serviceClient.storage.from('tenant-assets').getPublicUrl(path)
      uploadUpdates[urlField] = publicUrl
    }
  }

  if (Object.keys(uploadUpdates).length > 0) {
    await supabase
      .from('tenant_branding')
      .update(uploadUpdates)
      .eq('tenant_id', branding.tenant_id)
  }

  revalidatePath('/store-settings')
  return { success: true, message: 'Configurações salvas com sucesso!', errors: null }
}
```

- [ ] **Criar `store-settings/_components/store-settings-form.tsx`**

```typescript
// apps/console/src/app/(private)/store-settings/_components/store-settings-form.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'

import type { BrandingSettings } from '../queries'
import { updateStoreSettings } from '../actions'

const BASE_COLORS = ['Neutral', 'Stone', 'Zinc', 'Mauve', 'Olive', 'Mist', 'Taupe']
const THEME_COLORS = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green',
  'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo',
  'violet', 'purple', 'fuchsia', 'pink', 'rose',
]

interface StoreSettingsFormProps {
  defaultValues: BrandingSettings
}

export function StoreSettingsForm({ defaultValues }: StoreSettingsFormProps) {
  const [, handleSubmit, isPending] = useFormState(
    updateStoreSettings,
    () => toast.success('Configurações salvas!'),
    (msg) => toast.error(msg),
  )

  return (
    <form onSubmit={handleSubmit} className="max-w-lg">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="base_color">Cor base</FieldLabel>
          <select
            id="base_color"
            name="base_color"
            defaultValue={defaultValues?.base_color ?? 'Neutral'}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {BASE_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="theme_color">Cor de destaque</FieldLabel>
          <select
            id="theme_color"
            name="theme_color"
            defaultValue={defaultValues?.theme_color ?? 'blue'}
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {THEME_COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field>
          <FieldLabel htmlFor="logo">Logo</FieldLabel>
          {defaultValues?.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaultValues.logo_url}
              alt="Logo atual"
              className="mb-2 h-8 w-auto rounded"
            />
          )}
          <Input
            id="logo"
            type="file"
            name="logo"
            accept="image/png,image/svg+xml,image/webp"
          />
          <p className="text-muted-foreground text-xs">PNG, SVG ou WebP. Máx 2MB.</p>
        </Field>

        <Field>
          <FieldLabel htmlFor="favicon">Favicon</FieldLabel>
          {defaultValues?.favicon_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={defaultValues.favicon_url}
              alt="Favicon atual"
              className="mb-2 h-4 w-4"
            />
          )}
          <Input
            id="favicon"
            type="file"
            name="favicon"
            accept="image/png,image/x-icon"
          />
          <p className="text-muted-foreground text-xs">PNG ou ICO. Máx 512KB.</p>
        </Field>

        <Field>
          <Button type="submit" disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Salvar configurações'
            )}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  )
}
```

- [ ] **Criar `store-settings/page.tsx`**

```typescript
// apps/console/src/app/(private)/store-settings/page.tsx
import type { Metadata } from 'next'
import { StoreSettingsForm } from './_components/store-settings-form'
import { getTenantBrandingSettings } from './queries'

export const metadata: Metadata = { title: 'Configuração da Loja' }

export default async function StoreSettingsPage() {
  const branding = await getTenantBrandingSettings()

  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuração da Loja</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Personalize a aparência do seu espaço.
        </p>
      </div>

      <StoreSettingsForm defaultValues={branding} />
    </div>
  )
}
```

- [ ] **Commit**

```bash
git add apps/console/src/app/\(private\)/store-settings/
git commit -m "feat(console): módulo de configuração da loja com upload de logo e favicon"
```

---

## Task 12: Verificação final e build

- [ ] **Rodar o servidor de desenvolvimento do console**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter console dev
```

Verificar em `http://localhost:3001` (ou a porta usada pelo console):
- [ ] Página `/sign-in` renderiza sem erros (mesmo sem tenant real no dev, o layout deve funcionar)
- [ ] Sidebar aparece com itens: Dashboard, Produtos, Configuração da Loja
- [ ] Navegação entre rotas privadas funciona
- [ ] Sign-out funciona (redireciona para `/sign-in`)

- [ ] **Rodar build de produção para validar tipos e imports**

```bash
pnpm --filter console build
```

Esperado: build sem erros TypeScript ou de rota.

- [ ] **Commit final**

```bash
git add .
git commit -m "chore(console): build verificado — Console completo"
```

---

## Checklist de Segurança (verificar antes de PR)

- [ ] `storageKey: 'vello-console-auth'` está em `server.ts`, `client.ts` e `proxy.ts`
- [ ] Nenhum `supabase.from()` em Client Components (`'use client'`)
- [ ] `SUPABASE_SECRET_KEY` não é prefixado com `NEXT_PUBLIC_`
- [ ] `createServiceClient()` usado apenas em Server Actions e Route Handlers
- [ ] `hasTenantAccess()` importado de `@vello/auth` — sem arrays hardcoded no código
- [ ] Headers `x-tenant-id` e `x-tenant-slug` nunca retornados ao browser
- [ ] Sign-out no `profile-button.tsx` usa Server Action (não client-side Supabase)

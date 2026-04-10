# Spec: Vello Console

**Data:** 2026-04-09
**App:** `apps/console`
**Status:** aprovado
**Escopo:** Estrutura base do console com autenticação, branding dinâmico por tenant (slug/domínio), sidebar e módulos iniciais: Dashboard, Produtos e Configuração da Loja.

---

## Contexto

O `apps/console` já tem um esqueleto mínimo: `layout.tsx` com `TenantThemeLoader`, rota `/api/tenant-theme`, e clientes Supabase básicos. Esta spec formaliza a estrutura completa do app, o middleware de resolução de tenant, isolamento de sessão entre admin e console, e os três módulos.

---

## Seção 1 — Estrutura de Arquivos

Segue o mesmo padrão do `apps/admin` (documentado em `docs/architecture/conventions.md`).

```
apps/console/src/
├── app/
│   ├── layout.tsx                    ← RootLayout: lê x-tenant-slug, seta data-tenant-theme, monta TenantThemeLoader
│   ├── globals.css                   ← Tailwind 4 base + shadcn tokens (oklch)
│   ├── providers.tsx                 ← next-themes + Sonner ('use client')
│   ├── (public)/
│   │   ├── layout.tsx                ← Split 40/60: painel form + painel imagem/gradiente com branding do tenant
│   │   └── sign-in/
│   │       ├── page.tsx
│   │       ├── actions.ts            ← 'use server' — signInWithEmailAndPassword
│   │       └── sign-in-form.tsx      ← 'use client' — useFormState
│   └── (private)/
│       ├── layout.tsx                ← SidebarProvider + SidebarInset + Header
│       └── (dashboard)/
│           └── page.tsx              ← Dashboard em branco (placeholder)
├── assets/
│   └── logo.svg                      ← Logo Vello (fallback quando tenant sem logo)
├── components/
│   ├── sidebar/
│   │   ├── index.tsx                 ← Server — logo do tenant (do branding) ou Vello fallback
│   │   ├── nav-main.tsx              ← Server — itens: Dashboard, Produtos, Configuração da Loja
│   │   ├── nav-link.tsx              ← Client — usePathname() para item ativo
│   │   ├── nav-user.tsx              ← Server — wrapper rodapé
│   │   └── profile-button.tsx        ← Client — dropdown com logout
│   ├── header.tsx                    ← Server Component
│   ├── tenant-theme-loader.tsx       ← já existe — mantém
│   └── ui/                           ← shadcn/ui primitivos (Button, Field, Input, etc.)
├── hooks/
│   └── use-form-state.ts             ← mesmo padrão do admin
├── http/
│   └── sign-out.ts                   ← Server Action sem formulário
├── lib/
│   ├── supabase/
│   │   ├── storage-key.ts             ← helper getStorageKey(tenantId) — isolamento por tenant
│   │   ├── server.ts                 ← storageKey dinâmico via x-tenant-id header
│   │   ├── service.ts                ← já existe
│   │   ├── client.ts                 ← storageKey dinâmico via data-tenant-id do DOM
│   │   └── proxy.ts                  ← updateSession(request, tenantId) com storageKey dinâmico
│   ├── theme/
│   │   └── load-tenant-theme.ts      ← já existe — mantém
│   └── utils.ts                      ← cn()
└── proxy.ts                          ← middleware (era middleware.ts) — resolve tenant + protege rotas
```

---

## Seção 2 — Middleware e Resolução de Tenant

### Responsabilidades do `proxy.ts`

O middleware é o **único ponto** onde o tenant é resolvido. Todo o sistema de segurança parte daqui.

```
Request: GET creditos.empresa.com.br/dashboard
  ↓
proxy.ts (middleware Edge)
  ↓
  1. Extrai host do header `host`
  2. Resolve tenant:
     a. Subdomínio de vellofinance.com.br → slug = parte antes do primeiro "."
     b. Domínio customizado (custom_domain) → busca via service role no banco
  3. Valida que tenant.status = 'active' — senão: 404 ou página de tenant inativo
  4. Injeta headers internos (não expostos ao browser):
       x-tenant-id: uuid
       x-tenant-slug: "empresa"
  5. Chama updateSession (proxy.ts) para renovar sessão Supabase
  6. Extrai user autenticado → valida claims via @vello/auth:
       hasTenantAccess(claims.user_role) → false? signOut + redirect /sign-in
  7. Verifica isolamento multi-tenant:
       claims.tenant_id !== x-tenant-id? → signOut + redirect /sign-in
  8. Rota privada sem autenticação → redirect /sign-in
  9. Rota pública com usuário autenticado → redirect /
```

### Resolução de domínio

```typescript
// apps/console/src/proxy.ts
import { hasTenantAccess, getJwtClaims } from '@vello/auth'

function resolveTenantSlug(host: string): { type: 'subdomain' | 'custom'; value: string } | null {
  const velloHost = process.env.CONSOLE_BASE_DOMAIN ?? 'vellofinance.com.br'

  if (host.endsWith(`.${velloHost}`)) {
    const slug = host.replace(`.${velloHost}`, '')
    if (slug && slug !== 'www') return { type: 'subdomain', value: slug }
  }

  // Não é subdomínio Vello — trata como custom_domain
  return { type: 'custom', value: host }
}
```

### Segurança — headers internos

Os headers `x-tenant-id` e `x-tenant-slug` são **headers internos entre middleware e Server Components**. O Next.js não os expõe ao browser. Eles **nunca** devem ser retornados em respostas ao cliente.

O `CONSOLE_BASE_DOMAIN` é uma variável de ambiente server-side (sem prefixo `NEXT_PUBLIC_`).

---

## Seção 3 — Isolamento de Sessão

### 3.1 Entre Apps (Admin × Console)

Ambos os apps (`admin` e `console`) usam o mesmo projeto Supabase. O `@supabase/ssr` deriva o nome do cookie de sessão a partir do project-ref — sem intervenção, ambos os apps compartilhariam o mesmo cookie, o que permitiria que sessões do admin vazassem para o console em subdomínios do mesmo domínio pai (`.vellofinance.com.br`).

**Solução:** `storageKey` fixo e diferente no admin:

```typescript
// apps/admin — storageKey fixo (há apenas um "tenant": a própria Vello)
createServerClient(url, key, {
  auth: { storageKey: 'vello-admin-auth' },
  cookies: { ... }
})
```

### 3.2 Entre Tenants (Console)

No console, cada tenant opera em seu próprio subdomínio (`slug.vellofinance.com.br`) ou domínio customizado. Sem isolamento, cookies de sessão de um tenant seriam enviados ao subdomínio de outro tenant, permitindo tentativas de cross-tenant access.

**Solução:** `storageKey` dinâmico usando `tenant_id` (UUID):

```typescript
// apps/console — storageKey dinâmico por tenant_id
import { getStorageKey } from './storage-key'

// storage-key.ts → `vello-console-auth-${tenantId}`
createServerClient(url, key, {
  auth: { storageKey: getStorageKey(tenantId) },
  cookies: { ... }
})
```

**Por que `tenant_id` e não `slug`:** O slug é público (aparece na URL) e adivinhável. Se o `storageKey` usasse o slug, um atacante poderia fabricar um cookie com o nome `vello-console-auth-{slug-alvo}` e tentar roubar sessão. O `tenant_id` é um UUID opaco, nunca exposto em URLs.

**Como o `tenantId` chega a cada camada:**

| Arquivo | Fonte do `tenantId` |
|---|---|
| `proxy.ts` (middleware) | `resolveTenant(host)` → passa para `updateSession(request, tenantId)` |
| `lib/supabase/proxy.ts` | Recebe como parâmetro de `updateSession()` |
| `lib/supabase/server.ts` | `headers().get('x-tenant-id')` — injetado pelo middleware |
| `lib/supabase/client.ts` | `document.documentElement.dataset.tenantId` — injetado no `<html>` pelo root layout |

### 3.3 Defesa em profundidade

Três camadas de proteção operam em paralelo:

1. **Cookie por tenant_id** — sessão do tenant A simplesmente não existe no contexto do tenant B
2. **Middleware** — valida `claims.tenant_id === tenant.id` (JWT vs host), rejeita cross-tenant
3. **RLS no banco** — filtra por `(auth.jwt() ->> 'tenant_id')::uuid`, proteção na camada de dados

### Segunda camada: validação de role no middleware

Além do `storageKey`, o middleware de cada app valida o role do JWT usando **exclusivamente** funções do `@vello/auth` — sem arrays hardcoded:

```typescript
// Console: rejeita qualquer role que não seja de tenant
import { hasTenantAccess, getJwtClaims } from '@vello/auth'

const claims = getJwtClaims(user)
if (!claims || !hasTenantAccess(claims.user_role)) {
  await supabase.auth.signOut()
  return NextResponse.redirect(signInUrl)
}
```

> **Pendência no Admin:** `apps/admin/src/proxy.ts` ainda não valida `user_role` com `@vello/auth`. Isso deve ser auditado em task futura (ver `docs/architecture/conventions.md`).

### Regra obrigatória: `@vello/auth` como fonte de verdade de RBAC

**Nunca inserir arrays de roles hardcoded nos apps.** Sempre importar de `@vello/auth`:

| Função | Uso |
|---|---|
| `hasTenantAccess(role)` | Verifica se role é `tenant_admin` ou `tenant_operator` |
| `hasBackofficeAccess(role)` | Verifica se role é backoffice |
| `isTenantRole(role)` | Alias de `hasTenantAccess` |
| `isBackofficeRole(role)` | Alias de `hasBackofficeAccess` |
| `getJwtClaims(user)` | Extrai e valida claims do JWT via Zod |
| `jwtClaimsSchema` | Schema Zod das claims |

---

## Seção 4 — Layout Público com Branding Dinâmico

O `(public)/layout.tsx` é Server Component. Lê os headers injetados pelo middleware e busca o branding **no servidor** via `createServiceClient()`. O browser recebe apenas HTML renderizado — sem URLs de API, sem chaves expostas.

### Split 40/60

```
┌──────── 40% ──────────┬──────────── 60% ────────────┐
│ bg: auth_bg_color     │                              │
│ (padrão: #18181b)     │  auth_bg_image_url           │
│                       │  object-cover                │
│  [logo do tenant]     │                              │
│  fallback: logo Vello │  Sem imagem: gradiente       │
│                       │  via CSS vars tenant         │
│  {children}           │  --tenant-primary →          │
│  (form centralizado)  │  --tenant-secondary          │
│                       │                              │
└───────────────────────┴──────────────────────────────┘
Mobile: empilhado, painel direito oculto
```

### Metadata dinâmica

`generateMetadata()` no layout público usa `favicon_url` e `company_display_name` do branding para definir favicon e `<title>` do tenant — tudo server-side.

```typescript
export async function generateMetadata(): Promise<Metadata> {
  const tenantId = (await headers()).get('x-tenant-id')
  if (!tenantId) return { title: 'Vello Console' }

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_branding')
    .select('favicon_url, company_display_name')
    .eq('tenant_id', tenantId)
    .single()

  return {
    title: data?.company_display_name ?? 'Vello Console',
    icons: data?.favicon_url ? { icon: data.favicon_url } : undefined,
  }
}
```

---

## Seção 5 — Módulos

### Dashboard — `(private)/(dashboard)/page.tsx`

Página em branco com título "Dashboard". Sem dados. Placeholder para métricas futuras.

### Produtos — `(private)/products/`

Lista os `tenant_products` + `products` do tenant autenticado. O RLS do banco filtra automaticamente pelo `tenant_id` do JWT (Categoria B — ver `docs/architecture/conventions.md`).

**O que o tenant vê:**
- Produtos que o admin habilitou para ele (`tenant_products`)
- Toggle para ativar/desativar cada produto (`is_active`)
- Taxa de comissão do tenant (read-only — configurada pelo admin)

**Ações disponíveis:**
- `toggleTenantProduct(productId, isActive)` — Server Action que atualiza `tenant_products.is_active`

**Segurança:** nenhum dado de comissão de outros tenants é exposto. RLS + `tenant_id` no JWT garante isso.

### Configuração da Loja — `(private)/store-settings/`

Formulário para o tenant personalizar a identidade visual do seu espaço:

| Campo | Detalhe |
|---|---|
| Base Color | Select (Neutral, Stone, Zinc, Mauve, Olive, Mist, Taupe) |
| Theme Color | Select (red, blue, green, violet, amber...) |
| Logo | Upload — PNG/SVG/WebP, máx 2MB |
| Favicon | Upload — PNG/ICO, máx 512KB |

**Upload:** Server Action com `createServiceClient()`. O arquivo nunca transita pelo browser para o Supabase. Salvo em `tenant-assets/[tenant_id]/logo` e `tenant-assets/[tenant_id]/favicon`.

**Campos fora do escopo do console:** auth_bg_image, custom CSS, company_display_name — esses ficam apenas no admin por ora.

---

## Seção 6 — Migration: `tenant_users`

A tabela `tenant_users` já é referenciada pelo auth hook (`20260407000009_create_auth_hook.sql`) mas ainda não existe. Esta migration deve ser criada.

```sql
-- supabase/migrations/20260409000000_create_tenant_users.sql

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

-- RLS: Categoria B — isolada por tenant
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Backoffice pode gerenciar todos os tenant_users (necessário para F3 — Ativar Tenant)
CREATE POLICY "backoffice_full_access" ON tenant_users
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Tenant vê apenas usuários do seu próprio tenant
CREATE POLICY "tenant_isolation" ON tenant_users
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

---

## Seção 7 — Atualizações em `packages/auth`

O pacote já tem `isTenantRole`, `isBackofficeRole`, `hasTenantAccess`, `hasBackofficeAccess`, `getJwtClaims` e `jwtClaimsSchema`. Nenhuma mudança necessária.

**O `roleSchema` já inclui** `tenant_admin` e `tenant_operator` — alinhado com o ENUM que será criado na migration.

---

## Seção 8 — `package.json` do Console

Dependências a adicionar (espelhando o admin):

```json
{
  "dependencies": {
    "@vello/auth": "workspace:*",
    "@radix-ui/react-avatar": "^1.1.11",
    "@radix-ui/react-dialog": "^1.1.15",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-label": "^2.1.8",
    "@radix-ui/react-separator": "^1.1.8",
    "@radix-ui/react-slot": "^1.2.4",
    "@radix-ui/react-tooltip": "^1.2.8",
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
  }
}
```

**Removidos do console (não necessários):**
- `@dnd-kit/*` — sem drag-and-drop no console por ora
- `@tiptap/*` — sem editor rich text no console por ora
- `@tanstack/react-query` — sem TanStack Query no console por ora (dados simples via Server Components)
- `@react-input/mask` — sem campos com máscara no console por ora
- `@vercel/analytics` — adicionar quando o app estiver em produção

---

## Seção 9 — Variáveis de Ambiente

Adicionar ao `packages/env/src/console.ts`:

```typescript
CONSOLE_BASE_DOMAIN  // domínio base (vellofinance.com.br) — server-side apenas
```

---

## Fora do Escopo desta Spec

- Forgot password / reset password (implementar depois)
- Múltiplos usuários por tenant (`tenant_operator`)
- Pipeline de propostas, CRM, Financeiro
- Configuração de domínio customizado pelo tenant
- Editor visual de tema avançado (custom CSS)
- Self-service de onboarding

---

## Critérios de Aceite

- [ ] Middleware resolve tenant por subdomínio E por custom_domain
- [ ] `storageKey` dinâmico por `tenant_id` (UUID) em todos os clientes Supabase do console (`getStorageKey(tenantId)`)
- [ ] `hasTenantAccess()` de `@vello/auth` valida role — sem arrays hardcoded
- [ ] Mismatch de `tenant_id` (JWT vs URL) causa signOut + redirect
- [ ] Layout público renderiza logo, favicon e cores do tenant server-side
- [ ] Migration `tenant_users` aplicada sem erro
- [ ] Dashboard em branco funcional com sidebar (Dashboard, Produtos, Configuração da Loja)
- [ ] Produtos lista `tenant_products` com toggle de ativação
- [ ] Configuração da loja salva base_color, theme_color, logo e favicon via Server Action
- [ ] Nenhuma query Supabase em Client Components

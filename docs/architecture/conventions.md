# Convenções do Projeto — Vello Finance

## Estrutura de Pastas por App (Next.js App Router)

Todos os 3 apps Next.js (`admin`, `console`, `store`) usam diretório `src/`:

```
apps/[admin|console|store]/src/
├── app/
│   ├── layout.tsx              ← Layout raiz (fonte + html/body + Providers)
│   ├── providers.tsx           ← ThemeProvider + TooltipProvider ('use client')
│   ├── globals.css             ← CSS variables + shadcn base + tokens Vello
│   ├── (public)/               ← Route group: rotas sem autenticação
│   │   ├── layout.tsx          ← Layout duas colunas (form + decorativo)
│   │   └── sign-in/
│   │       ├── page.tsx
│   │       └── sign-in-form.tsx
│   ├── (private)/              ← Route group: rotas autenticadas
│   │   ├── layout.tsx          ← SidebarProvider + Header + conteúdo
│   │   └── [módulos]/          ← Ex: (dashboard)/, tenants/, plans/
│   ├── not-found/page.tsx      ← 404 estilizado (rewrite do proxy quando tenant não existe)
│   ├── unavailable/page.tsx    ← 503 estilizado (rewrite do proxy quando tenant inativo)
│   └── api/                    ← Route Handlers (quando Edge Function não basta)
├── assets/                     ← SVGs e imagens estáticas importadas no código
├── components/
│   ├── ui/                     ← shadcn/ui (gerado pelo CLI — não editar)
│   ├── header.tsx              ← Header compartilhado (server component)
│   └── sidebar/                ← Componentes da sidebar (ver padrão abaixo)
├── hooks/                      ← Custom hooks reutilizáveis
├── http/                       ← Server Actions que NÃO são de formulário (ex: sign-out)
├── lib/
│   ├── supabase/
│   │   ├── client.ts           ← Browser client — apenas auth.signOut()
│   │   ├── server.ts           ← Server client (RSC + Actions) — respeita RLS
│   │   ├── service.ts          ← Service client (secret key) — bypassa RLS
│   │   └── proxy.ts            ← updateSession helper para o proxy
│   └── utils.ts                ← cn()
└── proxy.ts                    ← Entry point Next.js 16 (era middleware.ts) — redirect logic
```

### Route Groups: `(public)` e `(private)`

| Grupo | Rotas | Layout |
|---|---|---|
| `(public)` | sign-in, forgot-password, sign-up | Duas colunas: form + imagem decorativa |
| `(private)` | dashboard, módulos autenticados | `SidebarProvider` + `Header` |

## Estrutura de Módulo (padrão para todos os apps)

```
src/app/(private)/plans/
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
    ├── plan-table.tsx
    ├── plan-form.tsx
    └── plan-status-badge.tsx
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

## `actions.ts` vs `src/http/`

| | `actions.ts` | `src/http/` |
|---|---|---|
| **Uso** | Server Actions de **formulários** | Server Actions **sem formulário** |
| **Localização** | Co-localizado com o módulo (`plans/actions.ts`) | `src/http/<nome>.ts` (global no app) |
| **Exemplos** | `createPlan`, `updateTenant`, `deletePlan` | `sign-out.ts`, `activate-tenant.ts` |
| **Importado por** | `sign-in-form.tsx`, `plan-form.tsx` (via `useFormState`) | Componentes que disparam ações sem form |

## Padrão de Server Action (formulários)

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

> **Premissa:** autenticação anônima desabilitada no projeto. A condição `tenant_id IS NOT NULL` assume que qualquer JWT presente pertence a um usuário autenticado. Se autenticação anônima for habilitada, adicionar: `AND (auth.jwt() ->> 'role') = ANY(ARRAY['tenant_admin','tenant_operator'])`.

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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=   # nunca expor no cliente
```

## Tratamento de Erros

- **Client Components:** `toast` (sonner) para feedback ao usuário
- **Server Actions:** retornar `{ error: string | FieldErrors }` ou `{ success: true, data?: T }`
- **Nunca expor stack traces ao usuário**
- **Erros inesperados:** logar no servidor com contexto (`user_id`, `tenant_id`, `action`)
- **Supabase errors:** tratar o campo `error.code` para mensagens amigáveis (ex: `23505` = duplicado)

## Arquitetura: Fat Server, Thin Client

### Regra central

O browser **NUNCA** fala diretamente com o Supabase.
Toda chamada ao banco é feita no servidor (Server Components, Server Actions, Route Handlers).

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

## Separação Server / Client

| Arquivo | Diretiva | Acessa Supabase? |
|---|---|---|
| `page.tsx` | nenhuma (Server Component por padrão) | ✅ Sim |
| `layout.tsx` | nenhuma (Server Component por padrão) | ✅ Sim |
| `queries.ts` | nenhuma (módulo servidor) | ✅ Sim |
| `actions.ts` | `'use server'` | ✅ Sim |
| `_components/*.tsx` | `'use client'` | ❌ Nunca |
| `hooks/*.ts` | `'use client'` | ❌ Nunca |

Dados chegam aos Client Components exclusivamente via props passadas pelo Server Component pai.

## Nomenclatura de Components

```typescript
// plans-table.tsx
export function PlansTable() { ... }  // ← PascalCase no export
```

## Nomenclatura de Arquivos

```text
_components/plans-table.tsx <- kebab-case
```
## Regra de UI: Sem Valores Arbitrários de Cor ou Dimensão

**Nunca usar valores hardcoded em classes Tailwind.** Todo valor de cor, tamanho ou dimensão deve referenciar um token do design system.

### ❌ Errado

```tsx
// Cores hardcoded
<div className="bg-[#F0F2F7] dark:bg-zinc-950">
<div className="border-[#E4E7F0] dark:border-zinc-800">
<span className="dark:bg-[#1E2D5A] dark:text-[#7B9EEE]">

// Dimensões hardcoded
<header className="h-[52px]">
<aside className="w-[220px]">

// Tamanhos de fonte fora da escala
<span className="text-[10px]">
<span className="text-[11px]">  // text-xs já é 11px

// CSS variables sem mapeamento
<aside className="w-[var(--sidebar-width)]">
```

### ✅ Correto

```tsx
// Tokens de cor do design system
<div className="bg-page-bg">
<div className="border-sidebar-border">
<span className="bg-sidebar-accent text-sidebar-accent-foreground">

// Tokens de dimensão do design system
<header className="h-topbar">
<aside className="w-sidebar">

// Escala tipográfica definida
<span className="text-2xs">   // 10px → definido em globals.css
<span className="text-xs">    // 11px → padrão Tailwind
```

### Como adicionar um token

Quando um valor arbitrário parecer necessário, **primeiro adicione um token** em `apps/[app]/app/globals.css`:

```css
/* 1. Defina a variável CSS (com o valor semântico) */
:root  { --meu-token: oklch(...); }
.dark  { --meu-token: oklch(...); }

/* 2. Mapeie para utility Tailwind no @theme inline */
@theme inline {
  --color-meu-token: var(--meu-token);   /* → bg-meu-token, text-meu-token */
  --width-meu-token: var(--meu-token);   /* → w-meu-token                   */
  --height-meu-token: var(--meu-token);  /* → h-meu-token                   */
  --text-meu-token: 0.75rem;             /* → text-meu-token                */
}
```

### Tokens de layout disponíveis

| Utility | Valor | Descrição |
|---|---|---|
| `bg-page-bg` | `#F0F2F7` / zinc-950 | Fundo da página (atrás dos painéis) |
| `bg-sidebar` | branco / zinc-900 | Fundo da sidebar e topbar |
| `bg-card` | branco / zinc-900 | Fundo de cards e painéis |
| `bg-sidebar-accent` | vello-subtle / `#1E2D5A` | Item ativo na sidebar |
| `text-sidebar-accent-foreground` | vello-blue / `#7B9EEE` | Texto do item ativo na sidebar |
| `border-sidebar-border` | `#E4E7F0` / zinc-800 | Bordas internas da sidebar |
| `border-border` | `#E4E7F0` / zinc-800 | Bordas gerais |
| `w-sidebar` | `220px` | Largura da sidebar |
| `h-topbar` | `52px` | Altura da topbar |
| `text-2xs` | `10px` | Badges e labels de suporte |

### Regra obrigatória: Tokens Semânticos (compatibilidade com temas de tenant)

Os apps `console` e `store` suportam white-label — o tema visual é sobrescrito por tenant via CSS variables injetadas em `[data-tenant-theme="slug"]`. **Usar cores fixas (zinc-800, white, slate-500, etc.) quebra o tema do tenant.**

**✅ Correto — tokens semânticos que respondem ao tema:**
```tsx
<h1 className="text-foreground">Título</h1>
<p className="text-muted-foreground">Subtítulo</p>
<div className="bg-background border-border">...</div>
<input className="bg-input border-input" />
<button className="bg-primary text-primary-foreground">Ação</button>
```

**❌ Errado — cores hardcoded que ignoram o tema:**
```tsx
<h1 className="text-white">Título</h1>
<p className="text-zinc-400">Subtítulo</p>
<div className="bg-zinc-900 border-zinc-700">...</div>
<input className="bg-zinc-800 border-zinc-700 text-white" />
```

**Mapa de substituição rápida:**

| Hardcoded | Token semântico |
|---|---|
| `text-white` / `text-black` | `text-foreground` |
| `text-zinc-400` / `text-gray-500` | `text-muted-foreground` |
| `text-zinc-300` | `text-foreground` (labels herdam do componente `FieldLabel`) |
| `bg-zinc-800` / `bg-zinc-900` | `bg-background` ou `bg-card` |
| `bg-white` | `bg-background` |
| `border-zinc-700` / `border-zinc-800` | `border-border` ou `border-input` |
| `bg-red-50 border-red-200` | Usar variant do componente (ex: `<Alert variant="destructive">`) |

> **Regra:** se você está escrevendo uma classe Tailwind de cor e o nome contém um número (zinc-800, gray-500, red-50), está errado. Use o token semântico equivalente.

### Exceções permitidas

- `app/page.tsx` (boilerplate temporário do `create-next-app` — será substituído)
- SVGs inline: atributo `stroke="white"` e similares (não são classes Tailwind)
- Valores de opacidade em tokens existentes: `text-foreground/70` é permitido

## Padrão de Sidebar (shadcn + server/client split)

A sidebar é composta usando os primitivos do shadcn `sidebar` com split obrigatório entre server e client components:

```
src/components/sidebar/
├── index.tsx          ← Server — monta estrutura (Header, Content, Footer)
├── nav-main.tsx       ← Server — define grupos e itens de navegação
├── nav-link.tsx       ← Client — detecta rota ativa via usePathname()
├── nav-user.tsx       ← Server — wrapper do rodapé do usuário
└── profile-button.tsx ← Client — dropdown menu com logout
```

**Regra:** toda lógica de interação (active state, dropdowns, usePathname) fica nos componentes `*-link.tsx` e `*-button.tsx`. Os componentes server só estruturam e passam dados.

**Item ativo — classes padrão:**
```tsx
isActive
  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
  : 'text-foreground/70 hover:bg-secondary hover:text-foreground'
```

**Dimensões do sidebar** — sempre via `style` inline no `SidebarProvider`, nunca hardcoded:
```tsx
<SidebarProvider
  style={{
    '--sidebar-width': 'calc(var(--spacing) * 72)',
    '--header-height': 'calc(var(--spacing) * 12)',
  } as React.CSSProperties}
>
```

## Padrão de Metadata e Título de Página

Toda página exporta `metadata` para compor o título com o template do root layout:

```tsx
// Root layout define o template
export const metadata: Metadata = {
  title: { template: '%s | Vello Admin', default: 'Vello Admin' },
}

// Cada page.tsx define seu título
export const metadata = { title: 'Tenants' }
// Resultado: "Tenants | Vello Admin"
```

O `Header` compartilhado **não recebe título como prop** — use `metadata`.

## Sistema de Formulário (`Field`)

Formulários **nunca** usam `<input>` avulso. Sempre o sistema `Field`:

```tsx
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

<FieldGroup>
  <Field>
    <FieldLabel htmlFor="email">E-mail</FieldLabel>
    <Input id="email" type="email" name="email" />
    <FieldError errors={formState.errors?.email} />
  </Field>
</FieldGroup>
```

**Componentes disponíveis:** `Field`, `FieldGroup`, `FieldLabel`, `FieldTitle`,
`FieldDescription`, `FieldError`, `FieldContent`, `FieldSeparator`, `FieldSet`, `FieldLegend`.

`Field` suporta `orientation`: `vertical` (padrão) | `horizontal` | `responsive`.

## Hook `useFormState` (Server Actions)

Para forms que chamam Server Actions:

```tsx
'use client'
import { useFormState } from '@/hooks/use-form-state'

const [formState, handleSubmit, isPending] = useFormState(
  minhaServerAction,
  () => router.push('/success'),     // onSuccess
  (msg) => toast.error(msg),         // onError
)
```

**Contrato obrigatório do Server Action:**
```ts
return {
  success: boolean,
  message: string | null,
  errors: Record<string, string[]> | null,  // chave = nome do campo
}
```

## Providers — Localização e Conteúdo

`providers.tsx` fica em `src/app/` (co-localizado com `layout.tsx`), não em `lib/`.
Sempre inclui `ThemeProvider` **e** `TooltipProvider` juntos:

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

## Padrão de RLS (Row Level Security)

Toda tabela nova deve ter RLS habilitada. Há três categorias:

### Categoria A — Tabelas do backoffice (sem acesso de tenant)

Usada em: `backoffice_users`, `plans`, `products`, `financial_partners`

```sql
ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON [tabela]
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );
```

> Variação: quando apenas `super_admin` deve escrever, usar duas policies separadas:
> - `backoffice_full_read` — FOR SELECT para todos os 4 roles
> - `super_admin_write` — FOR ALL USING (...) WITH CHECK (...) apenas para `super_admin`
>
> Ver: `supabase/migrations/20260401140000_fix_backoffice_users_rls.sql`

### Categoria B — Tabelas isoladas por tenant

Usada em: `tenant_products`, `tenant_branding`, `proposals`, `clients`

```sql
ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON [tabela]
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_isolation" ON [tabela]
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

> Toda tabela Categoria B deve ter `tenant_id UUID NOT NULL REFERENCES tenants(id)`.

### Categoria C — Tabelas globais lidas por tenants

Usada em: `plans`, `products` (quando tenants precisam ler registros ativos)

```sql
ALTER TABLE [tabela] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON [tabela]
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

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
- [ ] Se Categoria B: garantir `tenant_id UUID NOT NULL REFERENCES tenants(id)`

### Naming de triggers

- `set_updated_at_<tabela>` — triggers de updated_at (sem prefixo)
- `trg_<descricao>` — triggers de negócio (com prefixo `trg_`)

## Padrão de Roles (DB ENUM ↔ `@vello/auth`)

O PostgreSQL ENUM é a **fonte de verdade**. O pacote `@vello/auth` espelha os valores exatos.

| PostgreSQL ENUM | Valores | TypeScript (`@vello/auth`) |
|---|---|---|
| `backoffice_role` | `super_admin`, `admin`, `financial`, `support` | `BackofficeRole` |
| `tenant_role` | `tenant_admin`, `tenant_operator` | `TenantRole` |
| `tenant_type` | `whitelabel`, `subscription` | *(apenas DB)* |
| `tenant_status` | `pending`, `active`, `suspended`, `cancelled` | *(apenas DB)* |

**Regra:** ao adicionar um role novo:
1. `ALTER TYPE [enum_name] ADD VALUE 'novo_role'` na migration
2. Atualizar `z.union([...z.literal('novo_role')])` em `packages/auth/src/roles/role.ts`
3. Regenerar types: `pnpm db:types`
4. Atualizar policies RLS que usam `ANY(ARRAY[...])` se necessário

### Regra obrigatória: `@vello/auth` como fonte de RBAC nos apps

**Nunca inserir arrays de roles hardcoded nos apps** (`admin`, `console`, `store`). Sempre importar de `@vello/auth`:

```typescript
import { hasTenantAccess, hasBackofficeAccess, getJwtClaims } from '@vello/auth'

// ✅ Correto
if (!hasTenantAccess(claims.user_role)) { ... }

// ❌ Errado — hardcoded
if (!['tenant_admin', 'tenant_operator'].includes(role)) { ... }
```

| Função | Uso |
|---|---|
| `hasTenantAccess(role)` | Verifica se role é `tenant_admin` ou `tenant_operator` |
| `hasBackofficeAccess(role)` | Verifica se role é qualquer role backoffice |
| `isTenantRole(role)` | Alias de `hasTenantAccess` |
| `isBackofficeRole(role)` | Alias de `hasBackofficeAccess` |
| `getJwtClaims(user)` | Extrai e valida claims do JWT via Zod |
| `jwtClaimsSchema` | Schema Zod das claims |

> **Status de adoção:**
> - `apps/console` — obrigatório desde o início (implementado nesta spec)
> - `apps/admin` — pendente de auditoria para alinhar ao padrão

---

## Isolamento de Sessão

### Entre Apps (Admin × Console)

Ambos os apps usam o mesmo projeto Supabase. Para evitar que sessões vazem entre apps em subdomínios do mesmo domínio pai (`.vellofinance.com.br`), cada app usa um `storageKey` distinto em **todos** os clientes Supabase:

```typescript
// apps/admin — storageKey fixo (há apenas um "tenant": a própria Vello)
createServerClient(url, key, {
  auth: { storageKey: 'vello-admin-auth' },
  cookies: { ... }
})
```

### Entre Tenants (Console)

No console, cada tenant tem seu próprio cookie de sessão. O `storageKey` é dinâmico e usa o `tenant_id` (UUID) — nunca o slug (que é público na URL e adivinhável):

```typescript
// apps/console — storageKey dinâmico por tenant_id
import { getStorageKey } from './storage-key'

// storage-key.ts → `vello-console-auth-${tenantId}`
createServerClient(url, key, {
  auth: { storageKey: getStorageKey(tenantId) },
  cookies: { ... }
})
```

**Como o `tenantId` chega a cada camada:**

| Arquivo | Fonte do `tenantId` |
|---|---|
| `proxy.ts` (middleware) | `resolveTenant(host)` → passa `tenant.id` para `updateSession()` |
| `lib/supabase/server.ts` | `headers().get('x-tenant-id')` — injetado pelo middleware |
| `lib/supabase/client.ts` | `document.documentElement.dataset.tenantId` — injetado no `<html>` pelo root layout |
| `lib/supabase/proxy.ts` | Recebe `tenantId` como parâmetro de `updateSession(request, tenantId)` |

**Segurança (defesa em profundidade):**
1. Cookie por tenant_id (UUID) — sessão do tenant A simplesmente não existe no contexto do tenant B
2. Middleware valida `claims.tenant_id === tenant.id` — rejeita cross-tenant mesmo com cookie válido
3. RLS no banco filtra por `(auth.jwt() ->> 'tenant_id')::uuid` — proteção na camada de dados

Além disso, o middleware de cada app valida o `user_role` do JWT via `@vello/auth`:
- **Console:** rejeita roles de backoffice → signOut + redirect `/sign-in`
- **Admin:** rejeita roles de tenant → signOut + redirect `/sign-in` *(pendente de implementação)*

## Regras de Estruturação e Importação

### Um Componente por Arquivo

É **errado** declarar múltiplos componentes React exportados no mesmo arquivo. A convenção estrita é: **um arquivo para cada componente**.

**❌ Errado — múltiplos componentes no mesmo arquivo:**
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

**✅ Correto — arquivos separados:**
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

### Funções e Helpers

Ao ter funções ou lógicas utilitárias (helpers), crie um arquivo único para elas. Se uma função ou helper for utilizada em mais de um lugar, você deve extrai-la para um helper padrão/compartilhado (por exemplo, na pasta `src/lib/` ou um diretório `utils`).

### Importações Absolutas (`@/`)

**Nunca** utilize navegação de caminhos relativos voltando múltiplos diretórios (`../../../`) na importação de arquivos. Sempre use o atalho de importação absoluta do projeto `@/`.

**❌ Errado:**
```tsx
import { Button } from '../../../../components/ui/button'
import { cn } from '../../../lib/utils'
```

**✅ Correto:**
```tsx
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
```

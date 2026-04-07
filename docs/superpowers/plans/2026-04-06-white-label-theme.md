# White-Label Theme System — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar um sistema de tema dinâmico por tenant no console, com base em `base_color`, `theme_color`, tokens CSS e `custom_css` armazenados no banco.

**Architecture:** Três camadas de CSS: `globals.css` (base global) → `tenant-theme.css` gerado dinamicamente via `/api/tenant-theme` → `custom_css` injetado por último. O console é um novo Next.js 15 app no monorepo. Os campos de tema são gerenciados no admin e consumidos pelo console.

**Tech Stack:** Next.js 15 (App Router), Tailwind CSS 4, shadcn/ui, Supabase (PostgreSQL + RLS), `@supabase/ssr`, `@vello/database`, `@vello/env`.

---

## Mapeamento de arquivos

### Criados
- `supabase/migrations/20260406100000_alter_tenant_branding_add_theme_fields.sql`
- `supabase/migrations/20260406100100_create_tenant_theme_tokens.sql`
- `apps/console/package.json`
- `apps/console/next.config.ts`
- `apps/console/tsconfig.json`
- `apps/console/postcss.config.mjs`
- `apps/console/src/app/globals.css`
- `apps/console/src/app/layout.tsx`
- `apps/console/src/app/api/tenant-theme/route.ts`
- `apps/console/src/lib/supabase/server.ts`
- `apps/console/src/lib/theme/load-tenant-theme.ts`
- `apps/console/src/components/tenant-theme-loader.tsx`

### Modificados
- `packages/database/src/types.ts` ← regenerado via `pnpm db:types`
- `apps/admin/src/app/(private)/tenants/actions.ts` ← schema + action update
- `apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx` ← novos campos de tema

---

## Task 1: Migration — adicionar campos de tema em `tenant_branding`

**Files:**
- Create: `supabase/migrations/20260406100000_alter_tenant_branding_add_theme_fields.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- Migration: alter_tenant_branding_add_theme_fields
-- Adiciona suporte a tema dinâmico white-label por tenant.

ALTER TABLE tenant_branding
  ADD COLUMN IF NOT EXISTS use_custom_theme BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS base_color       TEXT,
  ADD COLUMN IF NOT EXISTS theme_color      TEXT,
  ADD COLUMN IF NOT EXISTS custom_css       TEXT;
```

- [ ] **Step 2: Aplicar a migration**

```bash
supabase db push
```

Expected: `Applied 1 migration(s)` sem erros.

- [ ] **Step 3: Verificar no banco**

```bash
supabase db diff --linked
```

Expected: nenhum diff pendente.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260406100000_alter_tenant_branding_add_theme_fields.sql
git commit -m "feat(database): add theme fields to tenant_branding (use_custom_theme, base_color, theme_color, custom_css)"
```

---

## Task 2: Migration — criar tabela `tenant_theme_tokens`

**Files:**
- Create: `supabase/migrations/20260406100100_create_tenant_theme_tokens.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- Migration: create_tenant_theme_tokens
-- Armazena tokens CSS semânticos gerados/editados por tenant.

CREATE TABLE tenant_theme_tokens (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

  -- Tokens de cor (valores CSS: oklch(...), hsl(...) ou qualquer CSS color)
  background             TEXT,
  foreground             TEXT,
  card                   TEXT,
  card_foreground        TEXT,
  popover                TEXT,
  popover_foreground     TEXT,
  primary_token          TEXT,   -- "primary" é palavra reservada em SQL
  primary_foreground     TEXT,
  secondary_token        TEXT,
  secondary_foreground   TEXT,
  muted                  TEXT,
  muted_foreground       TEXT,
  accent                 TEXT,
  accent_foreground      TEXT,
  destructive            TEXT,
  destructive_foreground TEXT,
  border_token           TEXT,   -- "border" é palavra reservada em SQL
  input_token            TEXT,
  ring_token             TEXT,
  radius_token           TEXT,   -- ex: "0.5rem"

  -- Tokens de chart
  chart_1                TEXT,
  chart_2                TEXT,
  chart_3                TEXT,
  chart_4                TEXT,
  chart_5                TEXT,

  -- Tokens de sidebar
  sidebar_background     TEXT,
  sidebar_foreground     TEXT,
  sidebar_primary        TEXT,
  sidebar_primary_foreground TEXT,
  sidebar_accent         TEXT,
  sidebar_accent_foreground  TEXT,
  sidebar_border         TEXT,
  sidebar_ring           TEXT,

  -- Tipografia opcional
  font_sans              TEXT,
  font_heading           TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-atualizar updated_at
CREATE TRIGGER set_updated_at_tenant_theme_tokens
  BEFORE UPDATE ON tenant_theme_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Criar tokens padrão automaticamente ao inserir tenant
CREATE OR REPLACE FUNCTION create_default_theme_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_theme_tokens (tenant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_theme_tokens
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_theme_tokens();

-- RLS
ALTER TABLE tenant_theme_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenant_theme_tokens
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_read_own" ON tenant_theme_tokens
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

- [ ] **Step 2: Aplicar a migration**

```bash
supabase db push
```

Expected: `Applied 1 migration(s)` sem erros.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260406100100_create_tenant_theme_tokens.sql
git commit -m "feat(database): create tenant_theme_tokens table with RLS"
```

---

## Task 3: Regenerar types do banco

**Files:**
- Modify: `packages/database/src/types.ts` ← gerado automaticamente

- [ ] **Step 1: Regenerar**

```bash
pnpm db:types
```

Expected: `packages/database/src/types.ts` atualizado com `tenant_theme_tokens` e os novos campos em `tenant_branding`.

- [ ] **Step 2: Verificar que os novos campos aparecem**

Abrir `packages/database/src/types.ts` e confirmar que existem:
- `tenant_branding.Row.use_custom_theme: boolean`
- `tenant_branding.Row.base_color: string | null`
- `tenant_branding.Row.theme_color: string | null`
- `tenant_branding.Row.custom_css: string | null`
- `tenant_theme_tokens` table completa

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/types.ts
git commit -m "chore(database): regenerate types after theme migrations"
```

---

## Task 4: Admin — atualizar schema e action de tenant

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/actions.ts`

- [ ] **Step 1: Estender `brandingSchema` com os novos campos**

No arquivo `apps/admin/src/app/(private)/tenants/actions.ts`, substituir o `brandingSchema` existente:

```typescript
const brandingSchema = z.object({
  company_display_name: z.string().optional().nullable(),
  primary_color: z.string().optional().nullable(),
  secondary_color: z.string().optional().nullable(),
  auth_bg_color: z.string().optional().nullable(),
  auth_theme: z.enum(['dark', 'light']).default('dark'),
  use_custom_theme: z.preprocess(
    (v) => v === 'on' || v === true,
    z.boolean().default(false),
  ),
  base_color: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
  custom_css: z.string().optional().nullable(),
})
```

- [ ] **Step 2: Incluir campos de tema no `brandingPayload`**

A lógica de `brandingPayload` já filtra `null`/`undefined`, portanto `base_color`, `theme_color`, `custom_css` e `use_custom_theme` serão incluídos automaticamente ao chamar `brandingResult.data`. Nenhuma mudança adicional é necessária na lógica de update.

- [ ] **Step 3: Verificar que o arquivo compila**

```bash
cd apps/admin && pnpm check-types
```

Expected: sem erros de TypeScript.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/(private)/tenants/actions.ts
git commit -m "feat(admin): extend brandingSchema with theme fields (use_custom_theme, base_color, theme_color, custom_css)"
```

---

## Task 5: Admin — adicionar campos de tema no formulário de tenant

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx`

- [ ] **Step 1: Adicionar imports necessários**

No topo do `tenant-form.tsx`, adicionar ao bloco de imports de UI:

```typescript
import { Switch } from '@/components/ui/switch'
```

- [ ] **Step 2: Adicionar os campos no Card "Identidade Visual"**

Após o campo `auth_bg_color` (ColorPicker) e antes do campo `logo`, adicionar:

```tsx
{/* Toggle: Habilitar tema customizado */}
<Field className="md:col-span-2">
  <div className="flex items-center justify-between rounded-lg border p-4">
    <div>
      <FieldLabel htmlFor="use_custom_theme" className="text-base">
        Tema White-Label
      </FieldLabel>
      <p className="text-sm text-muted-foreground">
        Ativa personalização avançada de tokens CSS por tenant.
      </p>
    </div>
    <Switch
      id="use_custom_theme"
      name="use_custom_theme"
      defaultChecked={false}
    />
  </div>
</Field>

{/* Base Color */}
<Field>
  <FieldLabel htmlFor="base_color">Base Color</FieldLabel>
  <select
    id="base_color"
    name="base_color"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
  >
    <option value="">Padrão do sistema</option>
    <option value="Neutral">Neutral</option>
    <option value="Stone">Stone</option>
    <option value="Zinc">Zinc</option>
    <option value="Mauve">Mauve</option>
    <option value="Olive">Olive</option>
    <option value="Mist">Mist</option>
    <option value="Taupe">Taupe</option>
  </select>
</Field>

{/* Theme Color */}
<Field>
  <FieldLabel htmlFor="theme_color">Theme Color</FieldLabel>
  <select
    id="theme_color"
    name="theme_color"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
  >
    <option value="">Padrão do sistema</option>
    <option value="red">Red</option>
    <option value="orange">Orange</option>
    <option value="amber">Amber</option>
    <option value="yellow">Yellow</option>
    <option value="lime">Lime</option>
    <option value="green">Green</option>
    <option value="emerald">Emerald</option>
    <option value="teal">Teal</option>
    <option value="cyan">Cyan</option>
    <option value="sky">Sky</option>
    <option value="blue">Blue</option>
    <option value="indigo">Indigo</option>
    <option value="violet">Violet</option>
    <option value="purple">Purple</option>
    <option value="fuchsia">Fuchsia</option>
    <option value="pink">Pink</option>
    <option value="rose">Rose</option>
  </select>
</Field>

{/* Custom CSS — ocupa largura total */}
<Field className="md:col-span-2">
  <FieldLabel htmlFor="custom_css">CSS Customizado</FieldLabel>
  <textarea
    id="custom_css"
    name="custom_css"
    rows={8}
    placeholder={`[data-tenant-theme="meu-tenant"] .hero-panel {\n  background: linear-gradient(135deg, #4b281e, #190c0a);\n}`}
    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
  />
  <p className="text-xs text-muted-foreground mt-1">
    CSS avançado aplicado depois do tema gerado. Use o seletor{' '}
    <code className="font-mono">[data-tenant-theme=&quot;slug&quot;]</code> para escopo.
  </p>
</Field>
```

- [ ] **Step 3: Verificar que o formulário compila**

```bash
cd apps/admin && pnpm check-types
```

Expected: sem erros de TypeScript.

- [ ] **Step 4: Confirmar que o Switch existe no admin**

```bash
ls apps/admin/src/components/ui/switch.tsx
```

Expected: arquivo existe. Se não existir, instalar via shadcn:

```bash
cd apps/admin && pnpm dlx shadcn@latest add switch
```

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx
git commit -m "feat(admin): add white-label theme fields to tenant form (use_custom_theme, base_color, theme_color, custom_css)"
```

---

## Task 6: Scaffold do console app

**Files:**
- Create: `apps/console/package.json`
- Create: `apps/console/next.config.ts`
- Create: `apps/console/tsconfig.json`
- Create: `apps/console/postcss.config.mjs`

- [ ] **Step 1: Criar `apps/console/package.json`**

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
    "check-types": "tsc --noEmit",
    "env:load": "dotenv -e ../../.env --"
  },
  "dependencies": {
    "@supabase/ssr": "^0.10.0",
    "@supabase/supabase-js": "^2.101.1",
    "@vello/database": "workspace:*",
    "@vello/env": "workspace:*",
    "next": "^15.3.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.2.2",
    "@types/node": "^22",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4.2.2",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Criar `apps/console/next.config.ts`**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {}

export default nextConfig
```

- [ ] **Step 3: Criar `apps/console/tsconfig.json`**

```json
{
  "extends": "@vello/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 4: Criar `apps/console/postcss.config.mjs`**

```javascript
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
```

- [ ] **Step 5: Instalar dependências**

```bash
pnpm install
```

Expected: sem erros, `apps/console/node_modules` criado (ou symlinks via workspace).

- [ ] **Step 6: Commit**

```bash
git add apps/console/package.json apps/console/next.config.ts apps/console/tsconfig.json apps/console/postcss.config.mjs
git commit -m "feat(console): scaffold Next.js app for tenant console"
```

---

## Task 7: Console — globals.css e layout raiz

**Files:**
- Create: `apps/console/src/app/globals.css`
- Create: `apps/console/src/app/layout.tsx`

- [ ] **Step 1: Criar `apps/console/src/app/globals.css`**

```css
@import "tailwindcss";

@custom-variant dark (&:is(.dark *));

@theme inline {
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
}

/* ─── Tema padrão (sem tenant white-label) ─── */
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
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 2: Criar `apps/console/src/app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Console',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
```

> Nota: o `data-tenant-theme` e o `TenantThemeLoader` serão adicionados na Task 11 após o componente existir.

- [ ] **Step 3: Criar página index temporária para validar o app**

Criar `apps/console/src/app/page.tsx`:

```tsx
export default function HomePage() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Console</h1>
    </main>
  )
}
```

- [ ] **Step 4: Verificar que o app builda**

```bash
cd apps/console && pnpm build
```

Expected: build bem-sucedido sem erros.

- [ ] **Step 5: Commit**

```bash
git add apps/console/src/
git commit -m "feat(console): add globals.css, root layout and placeholder page"
```

---

## Task 8: Console — Supabase server client

**Files:**
- Create: `apps/console/src/lib/supabase/server.ts`

- [ ] **Step 1: Criar `apps/console/src/lib/supabase/server.ts`**

```typescript
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@vello/database'
import { env } from '@vello/env/console'
import { cookies } from 'next/headers'

// Usar em: Server Components, Server Actions, Route Handlers.
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
            // Server Component — cookies só podem ser escritos em Actions/Route Handlers
          }
        },
      },
    },
  )
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd apps/console && pnpm check-types
```

Expected: sem erros de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/lib/supabase/server.ts
git commit -m "feat(console): add Supabase server client"
```

---

## Task 9: Console — Route Handler `/api/tenant-theme`

**Files:**
- Create: `apps/console/src/app/api/tenant-theme/route.ts`

Este endpoint é público (sem autenticação), pois o console pode ser acessado por usuários não autenticados. Ele busca os dados de tema do tenant pelo `slug` e retorna o payload necessário para o cliente aplicar o tema.

- [ ] **Step 1: Criar o Route Handler**

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const supabase = await createClient()

  // Buscar tenant pelo slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, slug')
    .eq('slug', slug)
    .single()

  if (tenantError || !tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
  }

  // Buscar branding e tokens em paralelo
  const [brandingResult, tokensResult] = await Promise.all([
    supabase
      .from('tenant_branding')
      .select('use_custom_theme, base_color, theme_color, custom_css')
      .eq('tenant_id', tenant.id)
      .single(),
    supabase
      .from('tenant_theme_tokens')
      .select('*')
      .eq('tenant_id', tenant.id)
      .single(),
  ])

  const branding = brandingResult.data
  const tokens = tokensResult.data

  // Se o tenant não usa tema customizado, retornar payload vazio
  if (!branding?.use_custom_theme) {
    return NextResponse.json({
      selector: null,
      baseColor: branding?.base_color ?? null,
      themeColor: branding?.theme_color ?? null,
      variables: {},
      customCss: null,
    })
  }

  const selector = `[data-tenant-theme="${slug}"]`

  // Mapear colunas do banco para nomes de CSS variables
  const variables: Record<string, string> = {}

  const tokenMap: Record<string, string | null | undefined> = {
    background:               tokens?.background,
    foreground:               tokens?.foreground,
    card:                     tokens?.card,
    'card-foreground':        tokens?.card_foreground,
    popover:                  tokens?.popover,
    'popover-foreground':     tokens?.popover_foreground,
    primary:                  tokens?.primary_token,
    'primary-foreground':     tokens?.primary_foreground,
    secondary:                tokens?.secondary_token,
    'secondary-foreground':   tokens?.secondary_foreground,
    muted:                    tokens?.muted,
    'muted-foreground':       tokens?.muted_foreground,
    accent:                   tokens?.accent,
    'accent-foreground':      tokens?.accent_foreground,
    destructive:              tokens?.destructive,
    'destructive-foreground': tokens?.destructive_foreground,
    border:                   tokens?.border_token,
    input:                    tokens?.input_token,
    ring:                     tokens?.ring_token,
    radius:                   tokens?.radius_token,
    'chart-1':                tokens?.chart_1,
    'chart-2':                tokens?.chart_2,
    'chart-3':                tokens?.chart_3,
    'chart-4':                tokens?.chart_4,
    'chart-5':                tokens?.chart_5,
    sidebar:                  tokens?.sidebar_background,
    'sidebar-foreground':     tokens?.sidebar_foreground,
    'sidebar-primary':        tokens?.sidebar_primary,
    'sidebar-primary-foreground': tokens?.sidebar_primary_foreground,
    'sidebar-accent':         tokens?.sidebar_accent,
    'sidebar-accent-foreground':  tokens?.sidebar_accent_foreground,
    'sidebar-border':         tokens?.sidebar_border,
    'sidebar-ring':           tokens?.sidebar_ring,
  }

  for (const [cssVar, value] of Object.entries(tokenMap)) {
    if (value) variables[cssVar] = value
  }

  return NextResponse.json({
    selector,
    baseColor: branding.base_color ?? null,
    themeColor: branding.theme_color ?? null,
    variables,
    customCss: branding.custom_css ?? null,
  })
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd apps/console && pnpm check-types
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/app/api/tenant-theme/route.ts
git commit -m "feat(console): add /api/tenant-theme route handler"
```

---

## Task 10: Console — utilitário client-side `load-tenant-theme`

**Files:**
- Create: `apps/console/src/lib/theme/load-tenant-theme.ts`

Este módulo roda no browser e aplica o tema ao DOM injetando CSS variables e o `custom_css`.

- [ ] **Step 1: Criar `apps/console/src/lib/theme/load-tenant-theme.ts`**

```typescript
interface TenantThemePayload {
  selector: string | null
  baseColor: string | null
  themeColor: string | null
  variables: Record<string, string>
  customCss: string | null
}

const STYLE_ID_TOKENS = 'tenant-theme-tokens'
const STYLE_ID_CUSTOM = 'tenant-theme-custom'

export async function loadTenantTheme(tenantSlug: string): Promise<void> {
  const response = await fetch(`/api/tenant-theme?slug=${tenantSlug}`)

  if (!response.ok) return

  const payload: TenantThemePayload = await response.json()

  applyTenantTheme(payload)
}

export function applyTenantTheme(payload: TenantThemePayload): void {
  // 1. Aplicar CSS variables como bloco <style>
  if (payload.selector && Object.keys(payload.variables).length > 0) {
    const declarations = Object.entries(payload.variables)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join('\n')

    const css = `${payload.selector} {\n${declarations}\n}`

    injectStyle(STYLE_ID_TOKENS, css)
  }

  // 2. Injetar custom_css por último (maior precedência)
  if (payload.customCss) {
    injectStyle(STYLE_ID_CUSTOM, payload.customCss)
  }
}

function injectStyle(id: string, css: string): void {
  let el = document.getElementById(id) as HTMLStyleElement | null

  if (!el) {
    el = document.createElement('style')
    el.id = id
    document.head.appendChild(el)
  }

  el.textContent = css
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd apps/console && pnpm check-types
```

Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add apps/console/src/lib/theme/load-tenant-theme.ts
git commit -m "feat(console): add loadTenantTheme client utility"
```

---

## Task 11: Console — componente `TenantThemeLoader` e integração no layout

**Files:**
- Create: `apps/console/src/components/tenant-theme-loader.tsx`
- Modify: `apps/console/src/app/layout.tsx`

- [ ] **Step 1: Criar `apps/console/src/components/tenant-theme-loader.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import { loadTenantTheme } from '@/lib/theme/load-tenant-theme'

interface TenantThemeLoaderProps {
  tenantSlug: string
}

export function TenantThemeLoader({ tenantSlug }: TenantThemeLoaderProps) {
  useEffect(() => {
    if (!tenantSlug || tenantSlug === 'default') return
    loadTenantTheme(tenantSlug)
  }, [tenantSlug])

  return null
}
```

- [ ] **Step 2: Atualizar `apps/console/src/app/layout.tsx`**

O layout precisa ler o tenant atual a partir dos headers ou variável de ambiente. Para o MVP, usar o header `x-tenant-slug` (injetado pelo middleware) ou `NEXT_PUBLIC_TENANT_SLUG`. Por ora, usamos um placeholder que será completado quando o middleware for implementado:

```tsx
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { TenantThemeLoader } from '@/components/tenant-theme-loader'
import './globals.css'

export const metadata: Metadata = {
  title: 'Console',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // O middleware injeta o slug do tenant no header x-tenant-slug.
  // Fallback: 'default' para tenants sem white-label.
  const headerStore = await headers()
  const tenantSlug = headerStore.get('x-tenant-slug') ?? 'default'

  return (
    <html lang="pt-BR" data-tenant-theme={tenantSlug}>
      <body>
        <TenantThemeLoader tenantSlug={tenantSlug} />
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verificar que compila**

```bash
cd apps/console && pnpm check-types
```

Expected: sem erros.

- [ ] **Step 4: Build final do console**

```bash
cd apps/console && pnpm build
```

Expected: build bem-sucedido.

- [ ] **Step 5: Commit**

```bash
git add apps/console/src/components/tenant-theme-loader.tsx apps/console/src/app/layout.tsx
git commit -m "feat(console): add TenantThemeLoader component and integrate into root layout"
```

---

## Task 12: Smoke test manual

- [ ] **Step 1: Subir o ambiente local**

```bash
pnpm dev
```

Expected: admin rodando em `localhost:3000` (ou porta configurada).

- [ ] **Step 2: Verificar o formulário no admin**

Navegar para `/tenants/new` no admin e confirmar:
- Switch "Tema White-Label" visível
- Select "Base Color" com as opções listadas
- Select "Theme Color" com as opções listadas
- Textarea "CSS Customizado" visível com placeholder

- [ ] **Step 3: Criar um tenant de teste com tema**

Preencher o formulário com:
- Nome: Teste White-Label
- Slug: `teste-wl`
- Ativar "Tema White-Label"
- Base Color: Zinc
- Theme Color: amber
- Custom CSS: `[data-tenant-theme="teste-wl"] body { outline: 2px solid red; }`

Clicar em "Cadastrar Parceiro" e confirmar `toast.success`.

- [ ] **Step 4: Verificar no banco**

```bash
supabase db diff --linked
```

Verificar no dashboard do Supabase (ou via psql) que `tenant_branding` tem:
- `use_custom_theme = true`
- `base_color = 'Zinc'`
- `theme_color = 'amber'`
- `custom_css` preenchido

- [ ] **Step 5: Testar o endpoint `/api/tenant-theme`**

Com o console rodando (porta separada), fazer:

```bash
curl "http://localhost:3001/api/tenant-theme?slug=teste-wl"
```

Expected (com tokens vazios, pois nenhum foi configurado ainda):

```json
{
  "selector": "[data-tenant-theme=\"teste-wl\"]",
  "baseColor": "Zinc",
  "themeColor": "amber",
  "variables": {},
  "customCss": "[data-tenant-theme=\"teste-wl\"] body { outline: 2px solid red; }"
}
```

---

## Critérios de aceite (checklist final)

- [ ] Console funciona com tema padrão sem nenhum tenant configurado
- [ ] Admin exibe campos `use_custom_theme`, `base_color`, `theme_color`, `custom_css` no formulário de tenant
- [ ] `/api/tenant-theme?slug=X` retorna payload correto
- [ ] `TenantThemeLoader` injeta `<style>` de tokens e `custom_css` no DOM
- [ ] `data-tenant-theme` está no `<html>` com o slug do tenant
- [ ] Estilos do tenant não vazam para outros contextos (escopo pelo atributo HTML)
- [ ] Tenant sem `use_custom_theme` recebe `variables: {}` e `customCss: null`

---

## Fora de escopo neste plano

- Middleware de identificação de tenant por domínio/subdomínio
- Editor visual de tokens em tempo real
- Preview de tema no admin
- Sanitização de CSS avançada
- Migração de tenants existentes para o novo schema

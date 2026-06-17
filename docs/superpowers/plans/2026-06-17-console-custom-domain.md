# Console Custom Domain — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar suporte a `console_custom_domain` no console, permitindo que tenants acessem o painel via domínio personalizado, e corrigir um bug no admin onde `custom_domain` da store era usado como URL do console.

**Architecture:** Nova coluna `console_custom_domain TEXT UNIQUE` na tabela `tenants`. O proxy do console já chama `resolveTenant(host)` — basta corrigir o filtro SQL de `custom_domain` para `console_custom_domain`. O admin ganha um campo no card existente e três arquivos com o bug são corrigidos.

**Tech Stack:** Next.js 15 (App Router), Supabase (PostgreSQL + RLS), TypeScript, Zod, Tailwind CSS, shadcn/ui.

---

## File Map

| Ação | Arquivo |
|------|---------|
| Criar | `supabase/migrations/20260617000000_add_console_custom_domain.sql` |
| Modificar | `apps/console/src/lib/tenant/resolve-tenant.ts` |
| Modificar | `apps/admin/src/app/(private)/tenants/tenant-schema.ts` |
| Modificar | `apps/admin/src/app/(private)/tenants/_components/tenant-form-types.ts` |
| Modificar | `apps/admin/src/app/(private)/tenants/_components/tenant-store-card.tsx` |
| Modificar | `apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx` |
| Modificar | `apps/admin/src/app/(private)/tenants/create-tenant.ts` |
| Modificar | `apps/admin/src/app/(private)/tenants/tenant-status-actions.ts` |
| Modificar | `apps/admin/src/app/(private)/tenants/[id]/edit/page.tsx` |

---

## Task 1: Migration — adicionar `console_custom_domain`

**Files:**
- Create: `supabase/migrations/20260617000000_add_console_custom_domain.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- Migration: add_console_custom_domain
-- Adiciona coluna para domínio personalizado do console (separado do custom_domain da store).

ALTER TABLE tenants ADD COLUMN console_custom_domain TEXT UNIQUE;
```

- [ ] **Step 2: Aplicar a migration**

```bash
pnpm supabase db push
```

Expected: migration aplicada sem erros.

- [ ] **Step 3: Regenerar os tipos TypeScript**

```bash
pnpm db:types
```

Expected: `packages/database/src/types.ts` atualizado com `console_custom_domain: string | null` na interface de `tenants`.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260617000000_add_console_custom_domain.sql packages/database/src/types.ts
git commit -m "feat(database): adiciona coluna console_custom_domain em tenants"
```

---

## Task 2: Console — corrigir `resolve-tenant.ts`

**Files:**
- Modify: `apps/console/src/lib/tenant/resolve-tenant.ts`

O arquivo atual usa `custom_domain=eq.${host}` para resolver custom domains — isso aponta para o campo da store. A correção é trocar pelo campo `console_custom_domain`.

- [ ] **Step 1: Corrigir o filtro**

Substituir no arquivo `apps/console/src/lib/tenant/resolve-tenant.ts`:

```ts
import { env } from '@vello/env/console'

export async function resolveTenant(
  rawHost: string,
): Promise<{ id: string; slug: string; status: string } | null> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SECRET_KEY
  const baseDomain = env.CONSOLE_BASE_DOMAIN

  if (!supabaseUrl || !serviceKey) return null

  // Remover porta do host (ex: "slug.vellofinance.com.br:3001" → "slug.vellofinance.com.br")
  const host = rawHost.split(':')[0]

  let filter: string

  if (host.endsWith(`.${baseDomain}`)) {
    // Subdomínio: slug.vellofinance.com.br → slug=slug
    const slug = host.slice(0, host.length - baseDomain.length - 1)
    if (!slug) return null
    filter = `slug=eq.${slug}`
  } else {
    // Domínio customizado do console → busca por console_custom_domain
    filter = `console_custom_domain=eq.${host}`
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
  const data = (await response.json()) as Array<{
    id: string
    slug: string
    status: string
  }>
  return data[0] ?? null
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/console/src/lib/tenant/resolve-tenant.ts
git commit -m "fix(console): resolve tenant por console_custom_domain em vez de custom_domain"
```

---

## Task 3: Admin — schema Zod e tipo `TenantForEdit`

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/tenant-schema.ts`
- Modify: `apps/admin/src/app/(private)/tenants/_components/tenant-form-types.ts`

- [ ] **Step 1: Adicionar `console_custom_domain` ao schema Zod**

Em `apps/admin/src/app/(private)/tenants/tenant-schema.ts`, adicionar a linha após `custom_domain`:

```ts
import { z } from 'zod'

export const tenantSchema = z.object({
  name: z.string().min(2).max(100),
  company_name: z.string().min(2).max(150).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  slug: z
    .string()
    .min(2)
    .max(63)
    .regex(
      /^[a-z0-9-]+$/,
      'Slug deve conter apenas letras minúsculas, números e hífens',
    ),
  custom_domain: z.string().optional().nullable(),
  console_custom_domain: z.string().optional().nullable(),
  contact_name: z.string().min(2).max(100).optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_agency: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_pix_key: z.string().optional().nullable(),
})

export const brandingSchema = z.object({
  company_display_name: z.string().optional().nullable(),
  use_custom_theme: z.preprocess(
    (v) => v === 'on' || v === true,
    z.boolean().default(false),
  ),
  base_color: z.string().optional().nullable(),
  theme_color: z.string().optional().nullable(),
})

const FORBIDDEN_CSS_PATTERNS = [
  /url\s*\(/i,
  /@import/i,
  /expression\s*\(/i,
  /javascript\s*:/i,
  /-moz-binding/i,
  /behavior\s*:/i,
]

export function sanitizeCss(css: string): string | null {
  for (const pattern of FORBIDDEN_CSS_PATTERNS) {
    if (pattern.test(css)) return null
  }
  return css
}

export function parseFormDataWithNulls(data: FormData): Record<string, unknown> {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }
  return obj
}
```

- [ ] **Step 2: Adicionar `console_custom_domain` ao tipo `TenantForEdit`**

Em `apps/admin/src/app/(private)/tenants/_components/tenant-form-types.ts`, adicionar a propriedade após `custom_domain`:

```ts
export type TenantForEdit = {
  id: string
  name: string
  company_name: string | null
  cnpj: string | null
  email: string
  phone: string | null
  slug: string
  custom_domain: string | null
  console_custom_domain: string | null
  bank_name: string | null
  bank_agency: string | null
  bank_account: string | null
  bank_pix_key: string | null
  tenant_branding: BrandingData[] | BrandingData | null
  tenant_users: Array<{ full_name: string | null }> | null
}
```

(O restante do arquivo permanece idêntico.)

- [ ] **Step 3: Verificar que TypeScript compila sem erros**

```bash
cd apps/admin && pnpm tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/\(private\)/tenants/tenant-schema.ts \
        apps/admin/src/app/\(private\)/tenants/_components/tenant-form-types.ts
git commit -m "feat(admin): adiciona console_custom_domain ao schema e tipo TenantForEdit"
```

---

## Task 4: Admin — UI no card "Configurações da Loja"

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/_components/tenant-store-card.tsx`
- Modify: `apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx`

- [ ] **Step 1: Adicionar prop e campo em `TenantStoreCard`**

Substituir o conteúdo de `apps/admin/src/app/(private)/tenants/_components/tenant-store-card.tsx`:

```tsx
import { Store } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

import type { FormErrors } from './tenant-form-types'

type Props = {
  slug: string
  onSlugChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  defaultCustomDomain: string
  defaultConsoleCustomDomain: string
  errors: FormErrors
}

export function TenantStoreCard({
  slug,
  onSlugChange,
  defaultCustomDomain,
  defaultConsoleCustomDomain,
  errors,
}: Props) {
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <Store className="size-5 text-muted-foreground" />
          <CardTitle>Configurações da Loja</CardTitle>
        </div>
        <CardDescription>
          URL de acesso à loja, ao console e domínios personalizados.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="slug">Slug *</FieldLabel>
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={onSlugChange}
              placeholder="credito-facil"
            />
            {slug && (
              <p className="text-xs text-muted-foreground mt-1">
                {slug}.vellofinance.com.br
              </p>
            )}
            <FieldError errors={errors?.slug} />
          </Field>

          <Field>
            <FieldLabel htmlFor="custom_domain">
              Domínio Customizado (Loja)
            </FieldLabel>
            <Input
              id="custom_domain"
              name="custom_domain"
              placeholder="creditos.empresa.com.br"
              defaultValue={defaultCustomDomain}
            />
            <FieldError errors={errors?.custom_domain} />
          </Field>

          <Field className="md:col-span-2">
            <FieldLabel htmlFor="console_custom_domain">
              Domínio Customizado (Console)
            </FieldLabel>
            <Input
              id="console_custom_domain"
              name="console_custom_domain"
              placeholder="painel.empresa.com.br"
              defaultValue={defaultConsoleCustomDomain}
            />
            <FieldError errors={errors?.console_custom_domain} />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Passar a nova prop em `tenant-form.tsx`**

Em `apps/admin/src/app/(private)/tenants/_components/tenant-form.tsx`, localizar o trecho onde `<TenantStoreCard>` é renderizado e adicionar a prop `defaultConsoleCustomDomain`:

```tsx
<TenantStoreCard
  slug={slug}
  onSlugChange={handleSlugChange}
  defaultCustomDomain={tenant?.custom_domain ?? ''}
  defaultConsoleCustomDomain={tenant?.console_custom_domain ?? ''}
  errors={formState.errors}
/>
```

- [ ] **Step 3: Verificar TypeScript**

```bash
cd apps/admin && pnpm tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/\(private\)/tenants/_components/tenant-store-card.tsx \
        apps/admin/src/app/\(private\)/tenants/_components/tenant-form.tsx
git commit -m "feat(admin): adiciona campo console_custom_domain no card de configurações da loja"
```

---

## Task 5: Admin — corrigir bug na URL do console

**Files:**
- Modify: `apps/admin/src/app/(private)/tenants/create-tenant.ts`
- Modify: `apps/admin/src/app/(private)/tenants/tenant-status-actions.ts`
- Modify: `apps/admin/src/app/(private)/tenants/[id]/edit/page.tsx`

Três lugares usavam `custom_domain` (campo da store) para construir a URL do console. A correção troca pelo campo correto `console_custom_domain`.

- [ ] **Step 1: Corrigir `create-tenant.ts`**

Em `apps/admin/src/app/(private)/tenants/create-tenant.ts`, substituir a linha que constrói `domain` (linha ~172):

```ts
  // Construir URL de reset
  const domain =
    tenantData.console_custom_domain ?? `${tenantData.slug}.${env.CONSOLE_BASE_DOMAIN}`
  const resetUrl = `https://${domain}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`
```

- [ ] **Step 2: Corrigir `tenant-status-actions.ts`**

Em `apps/admin/src/app/(private)/tenants/tenant-status-actions.ts`, fazer duas alterações:

**2a.** Atualizar o select para incluir `console_custom_domain` (e remover `custom_domain` que não é mais necessário nesta action):

```ts
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id, email, slug, console_custom_domain, name')
    .eq('id', tenantId)
    .single()
```

**2b.** Substituir a linha que constrói `domain` (linha ~76):

```ts
  // Construir URL de reset
  const domain =
    tenant.console_custom_domain ?? `${tenant.slug}.${env.CONSOLE_BASE_DOMAIN}`
  const resetUrl = `https://${domain}/reset-password?token=${linkData.properties.hashed_token}&type=recovery`
```

- [ ] **Step 3: Corrigir a exibição da URL do console em `edit/page.tsx`**

Em `apps/admin/src/app/(private)/tenants/[id]/edit/page.tsx`, adicionar o import de `env` e corrigir a linha de exibição:

Adicionar no topo do arquivo (após os imports existentes):
```ts
import { env } from '@vello/env/admin'
```

Substituir a linha que exibe a URL (linha ~37):
```tsx
              {tenant.console_custom_domain || `${tenant.slug}.${env.CONSOLE_BASE_DOMAIN}`}
```

- [ ] **Step 4: Verificar TypeScript**

```bash
cd apps/admin && pnpm tsc --noEmit
```

Expected: sem erros.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/\(private\)/tenants/create-tenant.ts \
        apps/admin/src/app/\(private\)/tenants/tenant-status-actions.ts \
        apps/admin/src/app/\(private\)/tenants/\[id\]/edit/page.tsx
git commit -m "fix(admin): usa console_custom_domain ao construir URL do console nos emails e na tela de edição"
```

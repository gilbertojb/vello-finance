# Product Types — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar a tabela `product_types` no banco, um módulo CRUD em `/product-types` no admin, e migrar `products.type` (CHECK constraint hardcoded) para uma FK dinâmica `product_type_id`.

**Architecture:** Tabela `product_types` com slug único pre-populada com os 6 tipos existentes. A tabela `products` troca a coluna `type TEXT CHECK` por `product_type_id UUID FK`. O módulo `/product-types` segue o padrão Server Component + Server Actions + `_components/`. O formulário de produtos carrega os tipos dinamicamente via query no servidor.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS), Server Actions, shadcn/ui, Zod, TypeScript.

---

## Arquivos criados / modificados

### Novos
- `supabase/migrations/20260408120000_create_product_types.sql`
- `supabase/migrations/20260408120001_migrate_products_type_to_fk.sql`
- `apps/admin/src/app/(private)/product-types/page.tsx`
- `apps/admin/src/app/(private)/product-types/new/page.tsx`
- `apps/admin/src/app/(private)/product-types/[id]/edit/page.tsx`
- `apps/admin/src/app/(private)/product-types/queries.ts`
- `apps/admin/src/app/(private)/product-types/actions.ts`
- `apps/admin/src/app/(private)/product-types/_components/product-type-table.tsx`
- `apps/admin/src/app/(private)/product-types/_components/product-type-form.tsx`

### Modificados
- `apps/admin/src/components/sidebar/nav-main.tsx` — link "Tipos de Produto"
- `apps/admin/src/app/(private)/products/queries.ts` — join com product_types
- `apps/admin/src/app/(private)/products/actions.ts` — trocar `type` por `product_type_id`
- `apps/admin/src/app/(private)/products/new/page.tsx` — passar productTypes
- `apps/admin/src/app/(private)/products/[id]/edit/page.tsx` — passar productTypes
- `apps/admin/src/app/(private)/products/_components/product-form.tsx` — select dinâmico
- `apps/admin/src/app/(private)/products/_components/product-table.tsx` — exibir nome do tipo
- `apps/admin/src/app/(private)/products/_components/product-type-badge.tsx` — usar nome do DB

---

## Task 1: Migration — Criar tabela `product_types`

**Files:**
- Create: `supabase/migrations/20260408120000_create_product_types.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260408120000_create_product_types.sql
-- Tipos de produto de crédito gerenciados pelo backoffice.
-- RLS: Categoria C — backoffice gerencia; tenants leem apenas tipos ativos.

CREATE TABLE product_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_product_types
  BEFORE UPDATE ON product_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON product_types
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_read_active" ON product_types
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );

-- Pre-popular com os tipos existentes (slugs espelham a CHECK constraint anterior)
INSERT INTO product_types (name, slug) VALUES
  ('FGTS',               'fgts'),
  ('Consignado Público',  'consignado_publico'),
  ('Consignado Privado',  'consignado_privado'),
  ('Home Equity',         'home_equity'),
  ('Auto Equity',         'auto_equity'),
  ('Outros',              'outros');
```

- [ ] **Step 2: Aplicar a migration**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
npx supabase db push
```

Esperado: migration aplicada sem erros, tabela `product_types` criada com 6 linhas.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260408120000_create_product_types.sql
git commit -m "feat(supabase): cria tabela product_types com tipos pre-populados"
```

---

## Task 2: Migration — Migrar `products.type` para `product_type_id`

**Files:**
- Create: `supabase/migrations/20260408120001_migrate_products_type_to_fk.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260408120001_migrate_products_type_to_fk.sql
-- Troca a coluna type TEXT CHECK por product_type_id UUID FK em products.
-- A coluna type é removida após a migração dos dados.

-- 1. Adicionar coluna FK (nullable para permitir UPDATE)
ALTER TABLE products
  ADD COLUMN product_type_id UUID REFERENCES product_types(id);

-- 2. Popular FK usando o slug
UPDATE products p
SET product_type_id = pt.id
FROM product_types pt
WHERE pt.slug = p.type;

-- 3. Tornar NOT NULL (falha se algum produto ficou sem correspondência)
ALTER TABLE products
  ALTER COLUMN product_type_id SET NOT NULL;

-- 4. Remover coluna antiga e sua CHECK constraint (implícita no DROP COLUMN)
ALTER TABLE products DROP COLUMN type;

-- 5. Índice para join frequente
CREATE INDEX idx_products_product_type ON products(product_type_id);
```

- [ ] **Step 2: Aplicar a migration**

```bash
npx supabase db push
```

Esperado: coluna `type` removida, coluna `product_type_id` adicionada com FK para `product_types`.

- [ ] **Step 3: Regenerar types do Supabase**

```bash
pnpm db:types
```

Esperado: `packages/database/src/types.ts` atualizado sem erros.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260408120001_migrate_products_type_to_fk.sql packages/database/src/types.ts
git commit -m "feat(supabase): migra products.type para FK product_type_id"
```

---

## Task 3: Módulo product-types — queries e actions

**Files:**
- Create: `apps/admin/src/app/(private)/product-types/queries.ts`
- Create: `apps/admin/src/app/(private)/product-types/actions.ts`

- [ ] **Step 1: Criar `queries.ts`**

```ts
// apps/admin/src/app/(private)/product-types/queries.ts
import { createClient } from '@/lib/supabase/server'

export async function listProductTypes(onlyActive = false) {
  const supabase = await createClient()
  let query = supabase
    .from('product_types')
    .select('id, name, slug, description, is_active, created_at')
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProductType(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_types')
    .select('id, name, slug, description, is_active')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Criar `actions.ts`**

```ts
// apps/admin/src/app/(private)/product-types/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const productTypeSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'Slug deve conter apenas letras minúsculas, números e underscore'),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export async function createProductType(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const parsed = productTypeSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('product_types').insert(parsed.data)

  if (error) {
    const msg = error.code === '23505'
      ? 'Já existe um tipo com este slug.'
      : error.message
    return { success: false, message: msg, errors: null }
  }

  revalidatePath('/product-types')
  return { success: true, message: 'Tipo de produto criado com sucesso!', errors: null }
}

export async function updateProductType(data: FormData) {
  const id = data.get('id') as string
  if (!id) return { success: false, message: 'ID não informado.', errors: null }

  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const updateSchema = productTypeSchema.omit({ slug: true })
  const parsed = updateSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('product_types')
    .update(parsed.data)
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/product-types')
  revalidatePath(`/product-types/${id}/edit`)
  return { success: true, message: 'Tipo de produto atualizado com sucesso!', errors: null }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/(private)/product-types/queries.ts \
        apps/admin/src/app/(private)/product-types/actions.ts
git commit -m "feat(admin): adiciona queries e actions de product-types"
```

---

## Task 4: Módulo product-types — componentes

**Files:**
- Create: `apps/admin/src/app/(private)/product-types/_components/product-type-table.tsx`
- Create: `apps/admin/src/app/(private)/product-types/_components/product-type-form.tsx`

- [ ] **Step 1: Criar `product-type-table.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/_components/product-type-table.tsx
'use client'

import { Pencil } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'

type ProductTypeRow = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
}

export function ProductTypeTable({
  productTypes,
}: {
  productTypes: ReadonlyArray<ProductTypeRow>
}) {
  if (!productTypes || productTypes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhum tipo de produto cadastrado.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/product-types/new">Cadastrar o primeiro tipo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border bg-card">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Nome
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Slug
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Descrição
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Status
            </th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {productTypes.map((pt) => (
            <tr key={pt.id} className="border-b transition-colors hover:bg-muted/50">
              <td className="p-4 align-middle font-medium">{pt.name}</td>
              <td className="p-4 align-middle text-muted-foreground text-xs font-mono">
                {pt.slug}
              </td>
              <td className="p-4 align-middle text-muted-foreground">
                {pt.description || '-'}
              </td>
              <td className="p-4 align-middle">
                {pt.is_active ? (
                  <span className="text-2xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                    Ativo
                  </span>
                ) : (
                  <span className="text-2xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                    Inativo
                  </span>
                )}
              </td>
              <td className="p-4 align-middle text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/product-types/${pt.id}/edit`}>
                    <Pencil className="size-4" />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Criar `product-type-form.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/_components/product-type-form.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useFormState } from '@/hooks/use-form-state'

import { createProductType, updateProductType } from '../actions'

type ProductTypeData = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
}

type Props = {
  productType?: ProductTypeData
}

export function ProductTypeForm({ productType }: Props) {
  const router = useRouter()
  const isEdit = !!productType

  const action = isEdit ? updateProductType : createProductType

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(isEdit ? 'Tipo atualizado!' : 'Tipo criado com sucesso!')
      router.push('/product-types')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-2xl">
      {isEdit && <input type="hidden" name="id" value={productType.id} />}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Identificação</CardTitle>
          <CardDescription>
            Nome e slug do tipo de produto. O slug não pode ser alterado após a criação.
          </CardDescription>
          <div className="my-auto flex items-center space-x-2">
            <FieldLabel htmlFor="is_active" className="cursor-pointer">
              Tipo Ativo
            </FieldLabel>
            <Switch
              id="is_active"
              name="is_active"
              defaultChecked={productType?.is_active ?? true}
            />
          </div>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <Field>
              <FieldLabel htmlFor="name">Nome *</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: FGTS"
                defaultValue={productType?.name ?? ''}
              />
              <FieldError errors={formState.errors?.name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="slug">Slug *</FieldLabel>
              <Input
                id="slug"
                name="slug"
                required
                placeholder="Ex: fgts"
                defaultValue={productType?.slug ?? ''}
                disabled={isEdit}
                className={isEdit ? 'opacity-50 cursor-not-allowed' : ''}
              />
              <FieldError errors={formState.errors?.slug} />
            </Field>

            <Field className="col-span-full">
              <FieldLabel htmlFor="description">Descrição</FieldLabel>
              <Input
                id="description"
                name="description"
                placeholder="Ex: Antecipação do saque-aniversário do FGTS"
                defaultValue={productType?.description ?? ''}
              />
              <FieldError errors={formState.errors?.description} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/product-types')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" /> : 'Salvar'}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/(private)/product-types/_components/
git commit -m "feat(admin): adiciona componentes de product-types (table + form)"
```

---

## Task 5: Módulo product-types — páginas

**Files:**
- Create: `apps/admin/src/app/(private)/product-types/page.tsx`
- Create: `apps/admin/src/app/(private)/product-types/new/page.tsx`
- Create: `apps/admin/src/app/(private)/product-types/[id]/edit/page.tsx`

- [ ] **Step 1: Criar `page.tsx` (listagem)**

```tsx
// apps/admin/src/app/(private)/product-types/page.tsx
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { ProductTypeTable } from './_components/product-type-table'
import { listProductTypes } from './queries'

export const metadata = {
  title: 'Tipos de Produto',
}

export default async function ProductTypesPage() {
  const productTypes = await listProductTypes()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Tipos de Produto</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/product-types/new">Cadastrar Tipo</Link>
          </Button>
        </div>
      </div>
      <ProductTypeTable productTypes={productTypes} />
    </div>
  )
}
```

- [ ] **Step 2: Criar `new/page.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/new/page.tsx
import { ProductTypeForm } from '../_components/product-type-form'

export const metadata = {
  title: 'Cadastrar Tipo de Produto',
}

export default function NewProductTypePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Cadastrar Tipo de Produto
          </h2>
          <p className="text-muted-foreground mt-2">
            Defina um novo tipo de produto disponível na plataforma.
          </p>
        </div>
      </div>
      <div className="pt-4">
        <ProductTypeForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar `[id]/edit/page.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/[id]/edit/page.tsx
import { notFound } from 'next/navigation'

import { ProductTypeForm } from '../../_components/product-type-form'
import { getProductType } from '../../queries'

export const metadata = {
  title: 'Editar Tipo de Produto',
}

export default async function EditProductTypePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const productType = await getProductType(id).catch(() => null)

  if (!productType) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Editar Tipo de Produto
          </h2>
          <p className="text-muted-foreground mt-2">{productType.name}</p>
        </div>
      </div>
      <div className="pt-4">
        <ProductTypeForm productType={productType} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/(private)/product-types/page.tsx \
        apps/admin/src/app/(private)/product-types/new/page.tsx \
        "apps/admin/src/app/(private)/product-types/[id]/edit/page.tsx"
git commit -m "feat(admin): adiciona páginas CRUD de product-types"
```

---

## Task 6: Sidebar — link "Tipos de Produto"

**Files:**
- Modify: `apps/admin/src/components/sidebar/nav-main.tsx`

- [ ] **Step 1: Adicionar import e link**

No arquivo `apps/admin/src/components/sidebar/nav-main.tsx`, adicionar o import de `Tag` (ícone do lucide) e o novo `SidebarMenuItem` logo abaixo de "Produtos":

```tsx
// Adicionar Tag ao import de lucide-react:
import {
  Banknote,
  BarChart2,
  Briefcase,
  Building2,
  FileText,
  Landmark,
  LayoutDashboard,
  Receipt,
  Tag,
} from 'lucide-react'

// Adicionar depois do SidebarMenuItem de products:
<SidebarMenuItem key="product-types">
  <NavLink href="/product-types" icon={<Tag />} label="Tipos de Produto" />
</SidebarMenuItem>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/components/sidebar/nav-main.tsx
git commit -m "feat(admin): adiciona link de tipos de produto na sidebar"
```

---

## Task 7: Atualizar módulo products — queries e actions

**Files:**
- Modify: `apps/admin/src/app/(private)/products/queries.ts`
- Modify: `apps/admin/src/app/(private)/products/actions.ts`

- [ ] **Step 1: Atualizar `queries.ts`**

Substituir o conteúdo do arquivo para:
1. Adicionar join com `product_types` em `listProducts` e `getProduct`
2. Remover `listFinancialPartners` do arquivo — mover para importação do módulo de product-types (não, manter aqui pois é usado pela página de produtos)
3. Adicionar `listProductTypes` neste arquivo também para reutilização

Conteúdo final do arquivo:

```ts
// apps/admin/src/app/(private)/products/queries.ts
import { createClient } from '@/lib/supabase/server'

export async function listProducts(onlyActive = false) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      is_active,
      product_type:product_types(id, name, slug),
      product_financial_partners(
        id,
        if_commission_pct,
        vello_commission_pct,
        is_active,
        financial_partner:financial_partners(id, name)
      )
    `)
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_type:product_types(id, name, slug),
      product_financial_partners(
        id,
        financial_partner_id,
        if_commission_pct,
        vello_commission_pct,
        is_active,
        financial_partner:financial_partners(id, name)
      )
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function listFinancialPartners(onlyActive = true) {
  const supabase = await createClient()
  let query = supabase
    .from('financial_partners')
    .select('id, name')
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function listProductTypes(onlyActive = true) {
  const supabase = await createClient()
  let query = supabase
    .from('product_types')
    .select('id, name, slug')
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}
```

- [ ] **Step 2: Atualizar `actions.ts`**

Substituir a validação do campo `type` por `product_type_id` no schema. Duas mudanças:

**a)** Trocar no `productSchema`:
```ts
// REMOVER:
type: z.enum(['fgts', 'consignado_publico', 'consignado_privado', 'home_equity', 'auto_equity', 'outros']),

// ADICIONAR:
product_type_id: z.string().uuid('Tipo de produto inválido.'),
```

**b)** Remover `type` do `productUpdateSchema.omit` (já omite `type`, agora o campo nem existe — remover o `.omit({ type: true })`):
```ts
// ANTES:
const productUpdateSchema = productSchema.omit({ type: true })

// DEPOIS:
const productUpdateSchema = productSchema
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/(private)/products/queries.ts \
        apps/admin/src/app/(private)/products/actions.ts
git commit -m "feat(admin): atualiza queries e actions de products para usar product_type_id"
```

---

## Task 8: Atualizar módulo products — componentes e páginas

**Files:**
- Modify: `apps/admin/src/app/(private)/products/_components/product-type-badge.tsx`
- Modify: `apps/admin/src/app/(private)/products/_components/product-table.tsx`
- Modify: `apps/admin/src/app/(private)/products/_components/product-form.tsx`
- Modify: `apps/admin/src/app/(private)/products/new/page.tsx`
- Modify: `apps/admin/src/app/(private)/products/[id]/edit/page.tsx`

- [ ] **Step 1: Atualizar `product-type-badge.tsx`**

O badge agora recebe o nome do DB diretamente em vez de mapear um slug. Simplificar o componente:

```tsx
// apps/admin/src/app/(private)/products/_components/product-type-badge.tsx
export function ProductTypeBadge({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
      {name}
    </span>
  )
}
```

- [ ] **Step 2: Atualizar `product-table.tsx`**

Atualizar o tipo `ProductRow` e a renderização do badge para usar `product_type.name`:

```tsx
// Atualizar tipo:
type ProductRow = {
  id: string
  name: string
  is_active: boolean
  product_type: { id: string; name: string; slug: string } | null
  product_financial_partners: PartnerRow[]
}

// Atualizar renderização (na coluna Tipo):
<td className="p-4 align-middle">
  <ProductTypeBadge name={product.product_type?.name ?? '-'} />
</td>
```

- [ ] **Step 3: Atualizar `product-form.tsx`**

**a)** Adicionar prop `productTypes` ao tipo `Props`:
```tsx
type ProductType = { id: string; name: string; slug: string }

type Props = {
  partners: Partner[]
  product?: ProductWithPartners
  productTypes: ProductType[]
}
```

**b)** Atualizar tipo `ProductWithPartners` — remover `type: string`, adicionar `product_type_id: string` e `product_type`:
```tsx
export type ProductWithPartners = {
  id: string
  name: string
  product_type_id: string
  product_type: { id: string; name: string; slug: string } | null
  description: string | null
  internal_description: string | null
  min_amount: number | null
  max_amount: number | null
  min_term_months: number | null
  max_term_months: number | null
  min_rate_monthly: number | null
  max_rate_monthly: number | null
  is_active: boolean
  product_financial_partners: Array<{
    financial_partner_id: string
    if_commission_pct: number
    vello_commission_pct: number
  }>
}
```

**c)** Substituir o `<select>` de tipo hardcoded pelo dinâmico:
```tsx
// No destructuring da função:
export function ProductForm({ partners, product, productTypes }: Props) {

// Substituir o <Field> do Tipo por:
<Field className="col-span-full md:col-span-2">
  <FieldLabel htmlFor="product_type_id">Tipo *</FieldLabel>
  <select
    id="product_type_id"
    name="product_type_id"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    required={!isEdit}
    disabled={isEdit}
    defaultValue={product?.product_type_id ?? ''}
  >
    <option value="">Selecione...</option>
    {productTypes.map((pt) => (
      <option key={pt.id} value={pt.id}>
        {pt.name}
      </option>
    ))}
  </select>
  <FieldError errors={formState.errors?.product_type_id} />
</Field>
```

- [ ] **Step 4: Atualizar `new/page.tsx`**

```tsx
// apps/admin/src/app/(private)/products/new/page.tsx
import { ProductForm } from '../_components/product-form'
import { listFinancialPartners, listProductTypes } from '../queries'

export const metadata = {
  title: 'Cadastrar Produto',
}

export default async function NewProductPage() {
  const [partners, productTypes] = await Promise.all([
    listFinancialPartners(),
    listProductTypes(),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Cadastrar Produto
          </h2>
          <p className="text-muted-foreground mt-2">
            Adicione um novo produto de crédito definindo suas taxas e as
            instituições financeiras que o operam.
          </p>
        </div>
      </div>

      <div className="pt-4">
        <ProductForm partners={partners} productTypes={productTypes} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Atualizar `[id]/edit/page.tsx`**

```tsx
// apps/admin/src/app/(private)/products/[id]/edit/page.tsx
import { notFound } from 'next/navigation'

import { ProductForm } from '../../_components/product-form'
import { getProduct, listFinancialPartners, listProductTypes } from '../../queries'

export const metadata = {
  title: 'Editar Produto',
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [product, partners, productTypes] = await Promise.all([
    getProduct(id).catch(() => null),
    listFinancialPartners(),
    listProductTypes(),
  ])

  if (!product) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Produto</h2>
          <p className="text-muted-foreground mt-2">{product.name}</p>
        </div>
      </div>

      <div className="pt-4">
        <ProductForm product={product} partners={partners} productTypes={productTypes} />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/app/(private)/products/
git commit -m "feat(admin): atualiza módulo products para usar product_type_id dinâmico"
```

---

## Verificação final

- [ ] `pnpm build` no admin passa sem erros de TypeScript
- [ ] Listagem de produtos exibe o nome do tipo corretamente (join com product_types)
- [ ] Formulário de produto exibe os tipos cadastrados no select
- [ ] CRUD de `/product-types` funciona: criar, editar, toggle ativo/inativo
- [ ] Sidebar exibe "Tipos de Produto" com link ativo correto
- [ ] Slug não pode ser editado após criação (campo disabled no form de edição)
- [ ] Duplicidade de slug retorna mensagem amigável (código 23505)

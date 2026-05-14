# Products Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Renomear a rota `/product-types` para `/pipelines` ("Esteiras"), mover `category` de `product_types` para `products`, adicionar campo Categoria e seletor de Esteira no formulário de produto, e adicionar filtros na listagem de produtos.

**Architecture:** Migração SQL move `category` de `product_types` para `products`. A rota `product-types` é renomeada para `pipelines` no sistema de arquivos Next.js com atualização de todos os labels e links internos. O formulário de produto ganha dois campos novos (Categoria na Seção 1, Esteira como nova Seção 4). A listagem de produtos ganha um componente de filtros client-side com `searchParams`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase JS SDK, Zod, shadcn/ui, Tailwind CSS

---

## Mapa de arquivos

**Criar:**
- `supabase/migrations/20260514120000_move_category_to_products.sql`
- `apps/admin/src/app/(private)/pipelines/` (renomeado de `product-types/`)
- `apps/admin/src/app/(private)/products/_components/product-pipeline-card.tsx`
- `apps/admin/src/app/(private)/products/_components/product-filters.tsx`

**Modificar:**
- `apps/admin/src/components/sidebar/nav-main.tsx`
- `apps/admin/src/app/(private)/products/product-schema.ts`
- `apps/admin/src/app/(private)/products/_components/product-form-types.ts`
- `apps/admin/src/app/(private)/products/_components/product-identification-card.tsx`
- `apps/admin/src/app/(private)/products/_components/product-form.tsx`
- `apps/admin/src/app/(private)/products/_components/product-table.tsx`
- `apps/admin/src/app/(private)/products/queries.ts`
- `apps/admin/src/app/(private)/products/create-product.ts`
- `apps/admin/src/app/(private)/products/update-product.ts`
- `apps/admin/src/app/(private)/products/page.tsx`
- `apps/admin/src/app/(private)/products/new/page.tsx`
- `apps/admin/src/app/(private)/products/[id]/edit/page.tsx`
- Todos os arquivos dentro de `pipelines/` (links e labels)

---

## Task 1: Migration — mover category para products

**Files:**
- Create: `supabase/migrations/20260514120000_move_category_to_products.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- supabase/migrations/20260514120000_move_category_to_products.sql

-- 1. Adicionar category em products (sem NOT NULL inicialmente)
ALTER TABLE products
  ADD COLUMN category TEXT CHECK (
    category IN ('pessoa_fisica', 'pessoa_juridica', 'financiamentos')
  );

-- 2. Popular a partir da esteira vinculada
UPDATE products p
  SET category = pt.category
  FROM product_types pt
  WHERE p.product_type_id = pt.id
    AND pt.category IS NOT NULL;

-- 3. Tornar obrigatório após popular
ALTER TABLE products
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN category SET DEFAULT 'pessoa_fisica';

-- 4. Remover category de product_types (esteiras não têm categoria)
ALTER TABLE product_types DROP COLUMN IF EXISTS category;
```

- [ ] **Step 2: Aplicar a migration**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm supabase db push
```

Esperado: migration aplicada sem erros.

- [ ] **Step 3: Regenerar types**

```bash
pnpm db:types
```

Esperado: `packages/database/src/types.ts` atualizado — `products` tem `category`, `product_types` não tem mais `category`.

- [ ] **Step 4: Verificar no banco**

```bash
pnpm supabase db diff
```

Esperado: sem diff pendente.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260514120000_move_category_to_products.sql packages/database/src/types.ts
git commit -m "feat(admin): move category de product_types para products"
```

---

## Task 2: Renomear rota product-types → pipelines

**Files:**
- Rename: `apps/admin/src/app/(private)/product-types/` → `apps/admin/src/app/(private)/pipelines/`

- [ ] **Step 1: Copiar a pasta**

```bash
cp -r apps/admin/src/app/\(private\)/product-types apps/admin/src/app/\(private\)/pipelines
```

- [ ] **Step 2: Atualizar `pipelines/page.tsx` — labels e links**

Conteúdo completo do arquivo:

```tsx
import Link from 'next/link'

import { Button } from '@/components/ui/button'

import { PipelineTable } from './_components/product-type-table'
import { listPipelines } from './queries'

export const metadata = {
  title: 'Esteiras',
}

export default async function PipelinesPage() {
  const pipelines = await listPipelines()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Esteiras</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/pipelines/new">Cadastrar Esteira</Link>
          </Button>
        </div>
      </div>
      <PipelineTable pipelines={pipelines} />
    </div>
  )
}
```

- [ ] **Step 3: Atualizar `pipelines/queries.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'

export async function listPipelines(onlyActive = false) {
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

export async function getPipeline(id: string) {
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

- [ ] **Step 4: Atualizar `pipelines/actions.ts` — revalidatePath e mensagens**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const pipelineSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9_]+$/, 'Slug deve conter apenas letras minúsculas, números e underscore'),
  description: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
})

export async function createPipeline(data: FormData) {
  await requireBackofficeUser()

  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const parsed = pipelineSchema.safeParse(obj)
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
    const msg =
      error.code === '23505' ? 'Já existe uma esteira com este slug.' : error.message
    return { success: false, message: msg, errors: null }
  }

  revalidatePath('/pipelines')
  return { success: true, message: 'Esteira criada com sucesso!', errors: null }
}

const pipelineUpdateSchema = pipelineSchema.omit({ slug: true })

export async function updatePipeline(data: FormData) {
  await requireBackofficeUser()

  const id = data.get('id') as string
  if (!id) return { success: false, message: 'ID não informado.', errors: null }

  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const parsed = pipelineUpdateSchema.safeParse(obj)
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

  revalidatePath('/pipelines')
  revalidatePath(`/pipelines/${id}/edit`)
  return { success: true, message: 'Esteira atualizada com sucesso!', errors: null }
}
```

- [ ] **Step 5: Atualizar `pipelines/_components/product-type-table.tsx` — renomear componente e links**

```tsx
'use client'

import { GitBranch, Pencil } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type PipelineRow = {
  id: string
  name: string
  slug: string
  description: string | null
  is_active: boolean
  created_at: string
}

export function PipelineTable({
  pipelines,
}: {
  pipelines: ReadonlyArray<PipelineRow>
}) {
  if (!pipelines || pipelines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhuma esteira cadastrada.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/pipelines/new">Cadastrar a primeira esteira</Link>
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
          {pipelines.map((pt) => (
            <tr
              key={pt.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle font-medium">{pt.name}</td>
              <td className="p-4 align-middle text-muted-foreground text-xs font-mono">
                {pt.slug}
              </td>
              <td className="p-4 align-middle text-muted-foreground">
                {pt.description || '-'}
              </td>
              <td className="p-4 align-middle">
                {pt.is_active ? (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                    Ativo
                  </Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                    Inativo
                  </Badge>
                )}
              </td>
              <td className="p-4 align-middle text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/pipelines/${pt.id}/pipeline`}>
                      <GitBranch className="size-4" />
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/pipelines/${pt.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: Atualizar `pipelines/_components/product-type-form.tsx` — redirect e labels**

Substituir as duas ocorrências de `/product-types` por `/pipelines` e o label "Tipo Ativo" por "Esteira Ativa":

```tsx
// Linha com router.push — trocar '/product-types' por '/pipelines'
router.push('/pipelines')

// Label
<FieldLabel htmlFor="is_active" className="cursor-pointer">
  Esteira Ativa
</FieldLabel>
```

Substituir também as duas chamadas de action para usar `createPipeline`/`updatePipeline` do novo `actions.ts`:

```tsx
import { createPipeline, updatePipeline } from '../actions'
// ...
const action = isEdit ? updatePipeline : createPipeline
```

- [ ] **Step 7: Atualizar `pipelines/new/page.tsx`**

```tsx
import { PipelineForm } from '../_components/product-type-form'

export const metadata = { title: 'Cadastrar Esteira' }

export default async function NewPipelinePage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cadastrar Esteira</h2>
          <p className="text-muted-foreground mt-2">
            Defina o nome e slug da esteira. Configure as etapas após criar.
          </p>
        </div>
      </div>
      <div className="pt-4">
        <PipelineForm />
      </div>
    </div>
  )
}
```

Renomear o export do componente no arquivo `product-type-form.tsx`:

```tsx
// Adicionar export com alias ao final do arquivo
export { ProductTypeForm as PipelineForm }
```

- [ ] **Step 8: Atualizar `pipelines/[id]/edit/page.tsx`**

```tsx
import { notFound } from 'next/navigation'
import { PipelineForm } from '../../_components/product-type-form'
import { getPipeline } from '../../queries'

export const metadata = { title: 'Editar Esteira' }

export default async function EditPipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pipeline = await getPipeline(id).catch(() => null)
  if (!pipeline) notFound()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Editar Esteira</h2>
          <p className="text-muted-foreground mt-2">{pipeline.name}</p>
        </div>
      </div>
      <div className="pt-4">
        <PipelineForm productType={pipeline} />
      </div>
    </div>
  )
}
```

- [ ] **Step 9: Atualizar `pipelines/[id]/pipeline/pipeline-actions.ts` e `pipeline-queries.ts`**

Em `pipeline-actions.ts`: substituir todas as ocorrências de `revalidatePath('/product-types'...)` por `revalidatePath('/pipelines'...)`.

```bash
grep -rn "product-types" apps/admin/src/app/\(private\)/pipelines/
```

Corrigir cada ocorrência encontrada.

- [ ] **Step 10: Remover a pasta original**

```bash
rm -rf apps/admin/src/app/\(private\)/product-types
```

- [ ] **Step 11: Verificar que não há referências à rota antiga**

```bash
grep -rn "product-types" apps/admin/src/ --include="*.ts" --include="*.tsx"
```

Esperado: nenhum resultado.

- [ ] **Step 12: Commit**

```bash
git add apps/admin/src/app/\(private\)/pipelines/ apps/admin/src/app/\(private\)/product-types/
git commit -m "feat(admin): renomeia rota product-types para pipelines (Esteiras)"
```

---

## Task 3: Atualizar navegação sidebar

**Files:**
- Modify: `apps/admin/src/components/sidebar/nav-main.tsx`

- [ ] **Step 1: Atualizar o item de menu**

Em `nav-main.tsx`, substituir o bloco do item `product-types`:

```tsx
<SidebarMenuItem key="pipelines">
  <NavLink
    href="/pipelines"
    icon={<Tag />}
    label="Esteiras"
  />
</SidebarMenuItem>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/components/sidebar/nav-main.tsx
git commit -m "feat(admin): atualiza nav — Tipos de Produto renomeado para Esteiras"
```

---

## Task 4: Atualizar product schema — adicionar category

**Files:**
- Modify: `apps/admin/src/app/(private)/products/product-schema.ts`

- [ ] **Step 1: Escrever teste do schema**

Criar `apps/admin/src/app/(private)/products/__tests__/product-schema.test.ts`:

```typescript
import { describe, expect, it } from 'vitest'
import { productSchema } from '../product-schema'

describe('productSchema', () => {
  it('aceita category válida', () => {
    const result = productSchema.safeParse({
      name: 'FGTS – QI Tech',
      product_type_id: '00000000-0000-0000-0000-000000000001',
      category: 'pessoa_fisica',
      is_active: true,
    })
    expect(result.success).toBe(true)
  })

  it('rejeita category inválida', () => {
    const result = productSchema.safeParse({
      name: 'FGTS – QI Tech',
      product_type_id: '00000000-0000-0000-0000-000000000001',
      category: 'invalida',
      is_active: true,
    })
    expect(result.success).toBe(false)
  })

  it('rejeita schema sem category', () => {
    const result = productSchema.safeParse({
      name: 'FGTS – QI Tech',
      product_type_id: '00000000-0000-0000-0000-000000000001',
      is_active: true,
    })
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Rodar o teste para confirmar que falha**

```bash
cd apps/admin && pnpm test product-schema
```

Esperado: FAIL — `category` não existe no schema.

- [ ] **Step 3: Atualizar `product-schema.ts`**

```typescript
import { z } from 'zod'

export function parseBrNumber(val: unknown): unknown {
  if (typeof val !== 'string' || val === '') return val
  const n = val.includes(',')
    ? parseFloat(val.replace(/\./g, '').replace(',', '.'))
    : parseFloat(val)
  return isNaN(n) ? val : n
}

export const PRODUCT_CATEGORIES = ['pessoa_fisica', 'pessoa_juridica', 'financiamentos'] as const
export type ProductCategory = typeof PRODUCT_CATEGORIES[number]

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  pessoa_fisica: 'Pessoa Física',
  pessoa_juridica: 'Pessoa Jurídica',
  financiamentos: 'Financiamentos',
}

export const productSchema = z.object({
  name: z.string().min(3).max(100),
  product_type_id: z.string().uuid('Tipo de produto inválido.'),
  category: z.enum(PRODUCT_CATEGORIES, {
    errorMap: () => ({ message: 'Categoria inválida.' }),
  }),
  description: z.string().optional().nullable(),
  internal_description: z.string().optional().nullable(),
  min_amount: z.preprocess(parseBrNumber, z.number().optional().nullable()),
  max_amount: z.preprocess(parseBrNumber, z.number().optional().nullable()),
  min_term_months: z.coerce.number().int().optional().nullable(),
  max_term_months: z.coerce.number().int().optional().nullable(),
  min_rate_monthly: z.preprocess(parseBrNumber, z.number().optional().nullable()),
  max_rate_monthly: z.preprocess(parseBrNumber, z.number().optional().nullable()),
  is_active: z.boolean().default(true),
})

export const productUpdateSchema = productSchema.omit({ product_type_id: true })

export const partnerCommissionSchema = z
  .object({
    financial_partner_id: z.string().uuid(),
    if_commission_pct: z.preprocess(parseBrNumber, z.number().min(0.001).max(100)),
    vello_commission_pct: z.preprocess(parseBrNumber, z.number().min(0).max(100)),
  })
  .superRefine((data, ctx) => {
    if (data.vello_commission_pct > data.if_commission_pct) {
      ctx.addIssue({
        code: 'custom',
        message: 'Retenção Vello não pode ser maior que a Comissão da IF',
        path: ['vello_commission_pct'],
      })
    }
  })

export function parseFormDataWithNulls(data: FormData): Record<string, unknown> {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }
  return obj
}
```

- [ ] **Step 4: Rodar o teste para confirmar que passa**

```bash
cd apps/admin && pnpm test product-schema
```

Esperado: PASS — todos os 3 casos passam.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/
git commit -m "feat(admin): adiciona category ao productSchema"
```

---

## Task 5: Atualizar product form types

**Files:**
- Modify: `apps/admin/src/app/(private)/products/_components/product-form-types.ts`

- [ ] **Step 1: Atualizar o arquivo**

```typescript
import type { ProductCategory } from '../product-schema'

export type Partner = { id: string; name: string }

export type Pipeline = {
  id: string
  name: string
  slug: string
  proposal_stages: { id: string; name: string; order_num: number }[]
}

export type ProductWithPartners = {
  id: string
  name: string
  product_type_id: string
  category: ProductCategory
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

type FormFieldError = { message?: string }

export type FormErrors = Record<string, FormFieldError[]> | null | undefined
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/_components/product-form-types.ts
git commit -m "feat(admin): adiciona Pipeline type e category em ProductWithPartners"
```

---

## Task 6: Atualizar product queries

**Files:**
- Modify: `apps/admin/src/app/(private)/products/queries.ts`

- [ ] **Step 1: Atualizar o arquivo completo**

```typescript
import { createClient } from '@/lib/supabase/server'

export type ProductFilters = {
  category?: string
  status?: string
  q?: string
}

export async function listProducts(filters: ProductFilters = {}) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      category,
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

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.status === 'active') {
    query = query.eq('is_active', true)
  } else if (filters.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  if (filters.q) {
    query = query.ilike('name', `%${filters.q}%`)
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

export async function listPipelines(onlyActive = true) {
  const supabase = await createClient()
  let query = supabase
    .from('product_types')
    .select('id, name, slug, proposal_stages(id, name, order_num)')
    .order('name')

  if (onlyActive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query
  if (error) throw error

  // Ordenar etapas por order_num (Supabase não suporta order em nested select)
  return (data ?? []).map((p) => ({
    ...p,
    proposal_stages: [...(p.proposal_stages ?? [])].sort(
      (a, b) => a.order_num - b.order_num,
    ),
  }))
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/queries.ts
git commit -m "feat(admin): atualiza queries de produtos — filtros e listPipelines"
```

---

## Task 7: Atualizar product identification card — adicionar Categoria, remover Tipo

**Files:**
- Modify: `apps/admin/src/app/(private)/products/_components/product-identification-card.tsx`

O campo `product_type_id` (select de Tipo) é removido deste card — vai para a Seção 4. O campo `category` é adicionado.

- [ ] **Step 1: Atualizar o arquivo**

```tsx
import { Info } from 'lucide-react'

import {
  Card,
  CardAction,
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
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { WysiwygEditor } from '@/components/ui/wysiwyg-editor'

import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '../product-schema'
import type { FormErrors, ProductWithPartners } from './product-form-types'

type Props = {
  product?: ProductWithPartners
  errors: FormErrors
}

export function ProductIdentificationCard({ product, errors }: Props) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Identificação</CardTitle>
        <CardDescription>
          Defina as informações básicas e a visibilidade do produto na plataforma.
        </CardDescription>
        <CardAction className="my-auto">
          <div className="flex items-center space-x-2">
            <FieldLabel htmlFor="is_active" className="cursor-pointer">
              Produto Ativo
            </FieldLabel>
            <Switch
              id="is_active"
              name="is_active"
              defaultChecked={product?.is_active ?? true}
            />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Field className="col-span-full md:col-span-2">
            <FieldLabel htmlFor="name">Nome do Produto *</FieldLabel>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ex: FGTS – QI Tech"
              defaultValue={product?.name ?? ''}
            />
            <FieldError errors={errors?.name} />
          </Field>

          <Field className="col-span-full md:col-span-2">
            <FieldLabel htmlFor="category">Categoria *</FieldLabel>
            <select
              id="category"
              name="category"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              defaultValue={product?.category ?? ''}
            >
              <option value="">Selecione...</option>
              {PRODUCT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
            <FieldError errors={errors?.category} />
          </Field>

          <Field className="col-span-full md:col-span-2 mt-4">
            <div className="flex flex-col">
              <FieldLabel htmlFor="description">
                Descrição Pública
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 stroke-accent" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Informação pública exibida para clientes.</p>
                  </TooltipContent>
                </Tooltip>
              </FieldLabel>
            </div>
            <WysiwygEditor
              id="description"
              name="description"
              placeholder="Ex: Antecipação do saque-aniversário"
              defaultValue={product?.description ?? ''}
            />
            <FieldError errors={errors?.description} />
          </Field>

          <Field className="col-span-full md:col-span-2 mt-4">
            <div className="flex flex-col">
              <FieldLabel htmlFor="internal_description">
                Descrição Interna
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-3 stroke-accent" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Informação confidencial visível apenas para os parceiros.</p>
                  </TooltipContent>
                </Tooltip>
              </FieldLabel>
            </div>
            <WysiwygEditor
              id="internal_description"
              name="internal_description"
              placeholder="Ex: Lembre-se de validar a taxa balcão 2x antes de fechar."
              defaultValue={product?.internal_description ?? ''}
            />
            <FieldError errors={errors?.internal_description} />
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/_components/product-identification-card.tsx
git commit -m "feat(admin): adiciona Categoria no card de identificação do produto"
```

---

## Task 8: Criar ProductPipelineCard (Seção 4)

**Files:**
- Create: `apps/admin/src/app/(private)/products/_components/product-pipeline-card.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'

import type { FormErrors, Pipeline, ProductWithPartners } from './product-form-types'

type Props = {
  pipelines: Pipeline[]
  product?: ProductWithPartners
  isEdit: boolean
  errors: FormErrors
}

export function ProductPipelineCard({ pipelines, product, isEdit, errors }: Props) {
  const [selectedId, setSelectedId] = useState(product?.product_type_id ?? '')

  const selected = pipelines.find((p) => p.id === selectedId)

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Esteira</CardTitle>
        <CardDescription>
          Defina o modelo de pipeline que este produto seguirá.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="product_type_id">Modelo de Pipeline *</FieldLabel>
            {isEdit && (
              <input
                type="hidden"
                name="product_type_id"
                value={product!.product_type_id}
              />
            )}
            <select
              id="product_type_id"
              name={isEdit ? undefined : 'product_type_id'}
              disabled={isEdit}
              required={!isEdit}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <FieldError errors={errors?.product_type_id} />
          </Field>

          {selected && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Etapas ({selected.proposal_stages.length})
                </span>
                <Link
                  href={`/pipelines/${selected.id}/pipeline`}
                  target="_blank"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Editar esteira
                  <ExternalLink className="size-3" />
                </Link>
              </div>

              {selected.proposal_stages.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Esta esteira ainda não possui etapas configuradas.
                </p>
              ) : (
                <ol className="space-y-1">
                  {selected.proposal_stages.map((stage, i) => (
                    <li
                      key={stage.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="flex size-5 items-center justify-center rounded-full bg-muted text-xs font-mono shrink-0">
                        {i + 1}
                      </span>
                      {stage.name}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/_components/product-pipeline-card.tsx
git commit -m "feat(admin): cria ProductPipelineCard — seletor de esteira com preview"
```

---

## Task 9: Atualizar ProductForm — incluir os novos cards

**Files:**
- Modify: `apps/admin/src/app/(private)/products/_components/product-form.tsx`

- [ ] **Step 1: Atualizar o arquivo**

```tsx
'use client'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useFormState } from '@/hooks/use-form-state'

import { createProduct, updateProduct } from '../actions'
import { ProductCreditParamsCard } from './product-credit-params-card'
import type { Partner, Pipeline, ProductWithPartners } from './product-form-types'
import { ProductIdentificationCard } from './product-identification-card'
import { ProductPartnersCard } from './product-partners-card'
import { ProductPipelineCard } from './product-pipeline-card'

export type { ProductWithPartners } from './product-form-types'

type Props = {
  partners: Partner[]
  pipelines: Pipeline[]
  product?: ProductWithPartners
}

export function ProductForm({ partners, pipelines, product }: Props) {
  const router = useRouter()
  const isEdit = !!product

  const linkedPartnerIds = new Set(
    product?.product_financial_partners.map((p) => p.financial_partner_id) ?? [],
  )

  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(linkedPartnerIds)

  const action = isEdit ? updateProduct : createProduct

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(isEdit ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!')
      router.push('/products')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  function togglePartner(id: string) {
    setSelectedPartners((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={product.id} />}

      {isEdit && (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Alterações nos percentuais não afetam propostas já criadas (snapshots imutáveis).
          </span>
        </div>
      )}

      <ProductIdentificationCard
        product={product}
        errors={formState.errors}
      />

      <ProductCreditParamsCard
        product={product}
        errors={formState.errors}
      />

      <ProductPartnersCard
        partners={partners}
        product={product}
        selectedPartners={selectedPartners}
        onTogglePartner={togglePartner}
      />

      <ProductPipelineCard
        pipelines={pipelines}
        product={product}
        isEdit={isEdit}
        errors={formState.errors}
      />

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/products')}
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

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/_components/product-form.tsx
git commit -m "feat(admin): adiciona ProductPipelineCard ao ProductForm"
```

---

## Task 10: Atualizar pages new e edit — passar pipelines

**Files:**
- Modify: `apps/admin/src/app/(private)/products/new/page.tsx`
- Modify: `apps/admin/src/app/(private)/products/[id]/edit/page.tsx`

- [ ] **Step 1: Atualizar `new/page.tsx`**

```tsx
import { ProductForm } from '../_components/product-form'
import { listFinancialPartners, listPipelines } from '../queries'

export const metadata = {
  title: 'Cadastrar Produto',
}

export default async function NewProductPage() {
  const [partners, pipelines] = await Promise.all([
    listFinancialPartners(),
    listPipelines(),
  ])

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Cadastrar Produto</h2>
          <p className="text-muted-foreground mt-2">
            Adicione um novo produto de crédito definindo suas taxas e as
            instituições financeiras que o operam.
          </p>
        </div>
      </div>
      <div className="pt-4">
        <ProductForm partners={partners} pipelines={pipelines} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar `[id]/edit/page.tsx`**

```tsx
import { notFound } from 'next/navigation'

import { ProductForm } from '../../_components/product-form'
import { getProduct, listFinancialPartners, listPipelines } from '../../queries'

export const metadata = {
  title: 'Editar Produto',
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [product, partners, pipelines] = await Promise.all([
    getProduct(id).catch(() => null),
    listFinancialPartners(),
    listPipelines(),
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
        <ProductForm product={product} partners={partners} pipelines={pipelines} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/new/page.tsx apps/admin/src/app/\(private\)/products/\[id\]/edit/page.tsx
git commit -m "feat(admin): passa pipelines para ProductForm nas páginas new/edit"
```

---

## Task 11: Atualizar product table — coluna Categoria e renomear Esteira

**Files:**
- Modify: `apps/admin/src/app/(private)/products/_components/product-table.tsx`

- [ ] **Step 1: Atualizar o arquivo**

```tsx
'use client'

import { Pencil } from 'lucide-react'
import Link from 'next/link'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { CATEGORY_LABELS, type ProductCategory } from '../product-schema'

type PartnerRow = {
  financial_partner: { name: string } | null
}

type ProductRow = {
  id: string
  name: string
  category: ProductCategory
  is_active: boolean
  product_type: { id: string; name: string; slug: string } | null
  product_financial_partners: PartnerRow[]
}

export function ProductTable({
  products,
}: {
  products: ReadonlyArray<ProductRow>
}) {
  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhum produto cadastrado.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/products/new">Cadastrar o primeiro produto</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border bg-card">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Nome
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Categoria
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Esteira
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Instituições Financeiras
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
          {products.map((product) => {
            const ifNames = product.product_financial_partners
              .map((pfp) => pfp.financial_partner?.name)
              .filter(Boolean)
              .join(', ')

            return (
              <tr
                key={product.id}
                className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
              >
                <td className="p-4 align-middle font-medium">{product.name}</td>
                <td className="p-4 align-middle">
                  <Badge variant="outline">
                    {CATEGORY_LABELS[product.category] ?? product.category}
                  </Badge>
                </td>
                <td className="p-4 align-middle">
                  {product.product_type ? (
                    <Link
                      href={`/pipelines/${product.product_type.id}/pipeline`}
                      className="text-sm text-primary hover:underline"
                    >
                      {product.product_type.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {ifNames || '-'}
                </td>
                <td className="p-4 align-middle">
                  {product.is_active ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                      Inativo
                    </Badge>
                  )}
                </td>
                <td className="p-4 align-middle text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/products/${product.id}/edit`}>
                      <Pencil className="size-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/_components/product-table.tsx
git commit -m "feat(admin): adiciona coluna Categoria e renomeia Tipo → Esteira na tabela"
```

---

## Task 12: Criar ProductFilters — barra de filtros

**Files:**
- Create: `apps/admin/src/app/(private)/products/_components/product-filters.tsx`

- [ ] **Step 1: Criar o arquivo**

```tsx
'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import { Input } from '@/components/ui/input'

import { CATEGORY_LABELS, PRODUCT_CATEGORIES } from '../product-schema'

type Props = {
  category: string
  status: string
  q: string
}

export function ProductFilters({ category, status, q }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams],
  )

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={category}
        onChange={(e) => updateParam('category', e.target.value)}
      >
        <option value="">Todas as categorias</option>
        {PRODUCT_CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {CATEGORY_LABELS[cat]}
          </option>
        ))}
      </select>

      <select
        className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        value={status}
        onChange={(e) => updateParam('status', e.target.value)}
      >
        <option value="">Todos os status</option>
        <option value="active">Ativo</option>
        <option value="inactive">Inativo</option>
      </select>

      <Input
        className="h-9 w-64"
        placeholder="Buscar por nome..."
        defaultValue={q}
        onBlur={(e) => updateParam('q', e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            updateParam('q', (e.target as HTMLInputElement).value)
          }
        }}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/_components/product-filters.tsx
git commit -m "feat(admin): cria componente ProductFilters com categoria, status e busca"
```

---

## Task 13: Atualizar products page — adicionar filtros

**Files:**
- Modify: `apps/admin/src/app/(private)/products/page.tsx`

- [ ] **Step 1: Atualizar o arquivo**

```tsx
import Link from 'next/link'
import { Suspense } from 'react'

import { Button } from '@/components/ui/button'

import { ProductFilters } from './_components/product-filters'
import { ProductTable } from './_components/product-table'
import { listProducts } from './queries'

export const metadata = {
  title: 'Produtos de Crédito',
}

type SearchParams = {
  category?: string
  status?: string
  q?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = await searchParams
  const products = await listProducts(filters)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Produtos de Crédito</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/products/new">Cadastrar Produto</Link>
          </Button>
        </div>
      </div>

      <Suspense>
        <ProductFilters
          category={filters.category ?? ''}
          status={filters.status ?? ''}
          q={filters.q ?? ''}
        />
      </Suspense>

      <ProductTable products={products} />
    </div>
  )
}
```

> `ProductFilters` usa `useSearchParams()` e precisa estar dentro de `<Suspense>` para não bloquear o Server Component pai.

- [ ] **Step 2: Verificar TypeScript**

```bash
cd apps/admin && pnpm tsc --noEmit
```

Esperado: zero erros.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/page.tsx
git commit -m "feat(admin): adiciona filtros por categoria, status e busca na listagem"
```

---

## Task 14: Verificação final

- [ ] **Step 1: Build completo**

```bash
cd apps/admin && pnpm build
```

Esperado: build sem erros.

- [ ] **Step 2: Checar referências órfãs**

```bash
grep -rn "product-types\|Tipos de Produto\|listProductTypes\|productTypes" \
  apps/admin/src/ --include="*.ts" --include="*.tsx"
```

Esperado: zero resultados (ou apenas comentários/histórico).

- [ ] **Step 3: Verificação manual no browser**

Iniciar o servidor de dev:
```bash
cd apps/admin && pnpm dev
```

Cheklist:
- [ ] `/pipelines` — lista de esteiras com nome correto no menu ("Esteiras")
- [ ] `/pipelines/new` — formulário com label "Cadastrar Esteira"
- [ ] `/pipelines/[id]/edit` — edição com label correto
- [ ] `/pipelines/[id]/pipeline` — editor de pipeline funciona normalmente
- [ ] `/products` — lista com colunas Categoria + Esteira + filtros visíveis
- [ ] Filtro por categoria filtra corretamente
- [ ] Filtro por status filtra corretamente
- [ ] Busca por nome funciona (blur ou Enter)
- [ ] `/products/new` — formulário com campo Categoria (Seção 1) e card Esteira (Seção 4)
- [ ] Ao selecionar uma esteira, as etapas aparecem abaixo do select
- [ ] Link "Editar esteira →" abre em nova aba
- [ ] `/products/[id]/edit` — campo Categoria mostra valor existente; Esteira mostra esteira atual (disabled)
- [ ] Criar produto novo salva com category corretamente
- [ ] Editar produto salva sem erros

- [ ] **Step 4: Commit final**

```bash
git add -A
git commit -m "chore(admin): verificação final — reestruturação produtos e esteiras"
```

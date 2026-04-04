# Produtos com N Instituições Financeiras — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a relação 1:1 entre produto e parceiro por N:N via `product_financial_partners`, movendo as comissões para essa tabela de junção e atualizando o formulário de produto com checkboxes de IFs.

**Architecture:** Duas migrations sequenciais (criar junção → remover colunas de `products`), seguidas de atualização de queries, actions e componentes. O formulário envia os parceiros selecionados como campos nomeados `partner_ids[]` + `if_commission_<uuid>` + `vello_commission_<uuid>`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + RLS), Zod, shadcn/ui

---

## Mapa de Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/20260404100000_create_product_financial_partners.sql` | Criar |
| `supabase/migrations/20260404100100_alter_products_remove_commission_columns.sql` | Criar |
| `apps/admin/src/app/(private)/products/queries.ts` | Modificar |
| `apps/admin/src/app/(private)/products/actions.ts` | Modificar |
| `apps/admin/src/app/(private)/products/_components/product-form.tsx` | Modificar |
| `apps/admin/src/app/(private)/products/_components/product-table.tsx` | Modificar |
| `apps/admin/src/app/(private)/products/new/page.tsx` | Modificar (texto menor) |
| `apps/admin/src/components/commissions/commission-cascade.tsx` | Modificar (renomear prop) |

---

## Task 1: Migration — Criar `product_financial_partners`

**Files:**
- Create: `supabase/migrations/20260404100000_create_product_financial_partners.sql`

- [ ] **Step 1: Criar o arquivo de migration**

Conteúdo completo do arquivo:

```sql
-- Migration: create_product_financial_partners
-- Relação N:N entre produtos e instituições financeiras.
-- Comissão negociada por par produto+IF (a mesma IF pode ter % diferentes por produto).
-- RLS: Categoria C — backoffice gerencia, tenants leem apenas registros ativos.

CREATE TABLE product_financial_partners (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  financial_partner_id UUID NOT NULL REFERENCES financial_partners(id) ON DELETE RESTRICT,
  if_commission_pct    NUMERIC(6,3) NOT NULL,  -- % que a IF paga à Vello (ex: 3.755)
  vello_commission_pct NUMERIC(6,3) NOT NULL,  -- % que a Vello retém
  -- Disponível ao tenant = if_commission_pct - vello_commission_pct
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(product_id, financial_partner_id),
  CONSTRAINT pfp_commission_valid CHECK (vello_commission_pct <= if_commission_pct),
  CONSTRAINT pfp_if_commission_positive CHECK (if_commission_pct > 0),
  CONSTRAINT pfp_vello_commission_non_negative CHECK (vello_commission_pct >= 0)
);

CREATE TRIGGER set_updated_at_product_financial_partners
  BEFORE UPDATE ON product_financial_partners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE product_financial_partners ENABLE ROW LEVEL SECURITY;

-- Backoffice gerencia tudo
CREATE POLICY "backoffice_full_access" ON product_financial_partners
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

-- Tenants leem apenas registros ativos cujo produto também esteja ativo
CREATE POLICY "tenant_read_active" ON product_financial_partners
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.is_active = true
    )
  );
```

- [ ] **Step 2: Aplicar a migration**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
npx supabase db push
```

Resultado esperado: `Applying migration 20260404100000_create_product_financial_partners.sql` sem erros.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260404100000_create_product_financial_partners.sql
git commit -m "feat(admin): cria tabela product_financial_partners com RLS"
```

---

## Task 2: Migration — Remover colunas de comissão de `products`

**Files:**
- Create: `supabase/migrations/20260404100100_alter_products_remove_commission_columns.sql`

- [ ] **Step 1: Criar o arquivo de migration**

```sql
-- Migration: alter_products_remove_commission_columns
-- Remove a relação 1:1 com financial_partners e as colunas de comissão,
-- agora gerenciadas por product_financial_partners.

ALTER TABLE products
  DROP COLUMN IF EXISTS financial_partner_id,
  DROP COLUMN IF EXISTS bank_commission_pct,
  DROP COLUMN IF EXISTS vello_commission_pct;
```

- [ ] **Step 2: Aplicar a migration**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
npx supabase db push
```

Resultado esperado: `Applying migration 20260404100100_alter_products_remove_commission_columns.sql` sem erros.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260404100100_alter_products_remove_commission_columns.sql
git commit -m "feat(admin): remove colunas de comissão e FK de financial_partner de products"
```

---

## Task 3: Atualizar `queries.ts`

**Files:**
- Modify: `apps/admin/src/app/(private)/products/queries.ts`

- [ ] **Step 1: Reescrever o arquivo completo**

```typescript
import { createClient } from '@/lib/supabase/server'

export async function listProducts(onlyActive = false) {
  const supabase = await createClient()
  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      type,
      is_active,
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
      product_financial_partners(
        id,
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
```

- [ ] **Step 2: Verificar que o TypeScript compila sem erros**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
npx tsc --noEmit
```

Erros esperados neste ponto: `product-table.tsx` e `product-form.tsx` ainda referenciam campos removidos — serão corrigidos nas próximas tasks.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/queries.ts
git commit -m "feat(admin): atualiza queries de produtos para relação N:N com IFs"
```

---

## Task 4: Atualizar `actions.ts`

**Files:**
- Modify: `apps/admin/src/app/(private)/products/actions.ts`

O formulário enviará os parceiros como:
- `partner_ids` — campo múltiplo (`getAll`), um valor por IF selecionada
- `if_commission_<uuid>` — comissão da IF para aquela IF
- `vello_commission_<uuid>` — retenção Vello para aquela IF

- [ ] **Step 1: Reescrever o arquivo completo**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

const productSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum([
    'fgts',
    'consignado_publico',
    'consignado_privado',
    'home_equity',
    'auto_equity',
    'outros',
  ]),
  description: z.string().optional().nullable(),
  internal_description: z.string().optional().nullable(),
  min_amount: z.coerce.number().optional().nullable(),
  max_amount: z.coerce.number().optional().nullable(),
  min_term_months: z.coerce.number().int().optional().nullable(),
  max_term_months: z.coerce.number().int().optional().nullable(),
  min_rate_monthly: z.coerce.number().optional().nullable(),
  max_rate_monthly: z.coerce.number().optional().nullable(),
  is_active: z.boolean().default(true),
})

const partnerCommissionSchema = z
  .object({
    financial_partner_id: z.string().uuid(),
    if_commission_pct: z.coerce.number().min(0.001).max(100),
    vello_commission_pct: z.coerce.number().min(0).max(100),
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

export async function createProduct(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>

  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'

  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const productResult = productSchema.safeParse(obj)

  if (!productResult.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(productResult.error).fieldErrors,
    }
  }

  // Parsear parceiros selecionados
  const partnerIds = data.getAll('partner_ids') as string[]
  const partnersData = partnerIds.map((id) => ({
    financial_partner_id: id,
    if_commission_pct: data.get(`if_commission_${id}`),
    vello_commission_pct: data.get(`vello_commission_${id}`),
  }))

  const partnersResult = z.array(partnerCommissionSchema).safeParse(partnersData)

  if (!partnersResult.success) {
    return {
      success: false,
      message: 'Verifique as comissões das instituições financeiras.',
      errors: null,
    }
  }

  const supabase = await createClient()

  // Inserir produto e obter id gerado
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert(productResult.data)
    .select('id')
    .single()

  if (productError) {
    return { success: false, message: productError.message, errors: null }
  }

  // Inserir vínculos com IFs (se houver)
  if (partnersResult.data.length > 0) {
    const rows = partnersResult.data.map((p) => ({
      product_id: product.id,
      financial_partner_id: p.financial_partner_id,
      if_commission_pct: p.if_commission_pct,
      vello_commission_pct: p.vello_commission_pct,
    }))

    const { error: partnersError } = await supabase
      .from('product_financial_partners')
      .insert(rows)

    if (partnersError) {
      return { success: false, message: partnersError.message, errors: null }
    }
  }

  revalidatePath('/products')

  return {
    success: true,
    message: 'Produto cadastrado com sucesso!',
    errors: null,
  }
}
```

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
npx tsc --noEmit 2>&1 | grep "actions.ts"
```

Resultado esperado: sem erros em `actions.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/actions.ts
git commit -m "feat(admin): atualiza action createProduct para inserir em product_financial_partners"
```

---

## Task 5: Atualizar `product-form.tsx`

**Files:**
- Modify: `apps/admin/src/app/(private)/products/_components/product-form.tsx`

Remove: card de Comissionamento, select único de parceiro, `CommissionCascade`, estados `bankPct`/`velloPct`.
Adiciona: card de Instituições Financeiras com checkboxes. Para cada IF marcada, exibe dois inputs inline.

- [ ] **Step 1: Reescrever o arquivo completo**

```typescript
'use client'

import { Banknote, Calendar, Info, Loader2, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { useFormState } from '@/hooks/use-form-state'

import { createProduct } from '../actions'

type Partner = { id: string; name: string }

export function ProductForm({ partners }: { partners: Partner[] }) {
  const router = useRouter()
  const [selectedPartners, setSelectedPartners] = useState<Set<string>>(new Set())

  const [formState, handleSubmit, isPending] = useFormState(
    createProduct,
    () => {
      toast.success('Produto criado com sucesso!')
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
      {/* Card 1 — Identificação */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Identificação</CardTitle>
          <CardDescription>
            Defina as informações básicas e a visibilidade do produto na
            plataforma.
          </CardDescription>
          <CardAction className="my-auto">
            <div className="flex items-center space-x-2">
              <FieldLabel htmlFor="is_active" className="cursor-pointer">
                Produto Ativo
              </FieldLabel>
              <Switch id="is_active" name="is_active" defaultChecked />
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
                placeholder="Ex: Consignado INSS"
              />
              <FieldError errors={formState.errors?.name} />
            </Field>

            <Field className="col-span-full md:col-span-2">
              <FieldLabel htmlFor="type">Tipo *</FieldLabel>
              <select
                id="type"
                name="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecione...</option>
                <option value="fgts">FGTS</option>
                <option value="consignado_publico">Consignado Público</option>
                <option value="consignado_privado">Consignado Privado</option>
                <option value="home_equity">Home Equity</option>
                <option value="auto_equity">Auto Equity</option>
                <option value="outros">Outros</option>
              </select>
              <FieldError errors={formState.errors?.type} />
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
              />
              <FieldError errors={formState.errors?.description} />
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
                      <p>
                        Informação confidencial visível apenas para os
                        parceiros.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </FieldLabel>
              </div>
              <WysiwygEditor
                id="internal_description"
                name="internal_description"
                placeholder="Ex: Lembre-se de validar a taxa balcão 2x antes de fechar."
              />
              <FieldError errors={formState.errors?.internal_description} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 2 — Parâmetros de Crédito */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Parâmetros de Crédito</CardTitle>
          <CardDescription>
            Limites operacionais e precificação padrão do produto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="flex items-center gap-2 uppercase text-sm font-medium text-primary/50">
                <Banknote className="size-4" />
                Limites de Valores
              </h2>
              <Field>
                <FieldLabel htmlFor="min_amount">Valor Mínimo (R$)</FieldLabel>
                <Input
                  id="min_amount"
                  name="min_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                <FieldError errors={formState.errors?.min_amount} />
              </Field>
              <Field>
                <FieldLabel htmlFor="max_amount">Valor Máximo (R$)</FieldLabel>
                <Input
                  id="max_amount"
                  name="max_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                />
                <FieldError errors={formState.errors?.max_amount} />
              </Field>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="flex items-center gap-2 uppercase text-sm font-medium text-primary/50">
                <Calendar className="size-4" />
                Prazos em Meses
              </h2>
              <Field>
                <FieldLabel htmlFor="min_term_months">
                  Prazo Mínimo (meses)
                </FieldLabel>
                <Input
                  id="min_term_months"
                  name="min_term_months"
                  type="number"
                  step="1"
                  placeholder="1"
                />
                <FieldError errors={formState.errors?.min_term_months} />
              </Field>
              <Field>
                <FieldLabel htmlFor="max_term_months">
                  Prazo Máximo (meses)
                </FieldLabel>
                <Input
                  id="max_term_months"
                  name="max_term_months"
                  type="number"
                  step="1"
                  placeholder="120"
                />
                <FieldError errors={formState.errors?.max_term_months} />
              </Field>
            </div>

            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <h2 className="flex items-center gap-2 uppercase text-sm font-medium text-primary/50">
                <TrendingUp className="size-4" />
                Taxas de Juros (% A.M.)
              </h2>
              <Field>
                <FieldLabel htmlFor="min_rate_monthly">
                  Taxa Mínima (%)
                </FieldLabel>
                <Input
                  id="min_rate_monthly"
                  name="min_rate_monthly"
                  type="number"
                  step="0.001"
                  placeholder="1.000"
                />
                <FieldError errors={formState.errors?.min_rate_monthly} />
              </Field>
              <Field>
                <FieldLabel htmlFor="max_rate_monthly">
                  Taxa Máxima (%)
                </FieldLabel>
                <Input
                  id="max_rate_monthly"
                  name="max_rate_monthly"
                  type="number"
                  step="0.001"
                  placeholder="5.000"
                />
                <FieldError errors={formState.errors?.max_rate_monthly} />
              </Field>
            </div>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 3 — Instituições Financeiras */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Instituições Financeiras</CardTitle>
          <CardDescription>
            Selecione as IFs que operam este produto e informe os percentuais
            de comissão negociados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {partners.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              Nenhuma instituição financeira cadastrada.
            </p>
          ) : (
            <div className="space-y-4">
              {partners.map((partner) => {
                const isSelected = selectedPartners.has(partner.id)
                return (
                  <div key={partner.id} className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="partner_ids"
                        value={partner.id}
                        checked={isSelected}
                        onChange={() => togglePartner(partner.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-sm font-medium">{partner.name}</span>
                    </label>

                    {isSelected && (
                      <div className="ml-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Field>
                          <FieldLabel htmlFor={`if_commission_${partner.id}`}>
                            IF paga à Vello (%)
                          </FieldLabel>
                          <Input
                            id={`if_commission_${partner.id}`}
                            name={`if_commission_${partner.id}`}
                            type="number"
                            step="0.001"
                            min="0.001"
                            max="100"
                            required
                            placeholder="Ex: 10.000"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`vello_commission_${partner.id}`}>
                            Retenção Vello (%)
                          </FieldLabel>
                          <Input
                            id={`vello_commission_${partner.id}`}
                            name={`vello_commission_${partner.id}`}
                            type="number"
                            step="0.001"
                            min="0"
                            max="100"
                            required
                            placeholder="Ex: 5.000"
                          />
                        </Field>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

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

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
npx tsc --noEmit 2>&1 | grep "product-form"
```

Resultado esperado: sem erros em `product-form.tsx`.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/_components/product-form.tsx
git commit -m "feat(admin): atualiza formulário de produto com checkboxes de IFs e comissões"
```

---

## Task 6: Atualizar `product-table.tsx`

**Files:**
- Modify: `apps/admin/src/app/(private)/products/_components/product-table.tsx`

Remove as colunas de comissão (agora variam por IF). Substitui coluna "Parceiro" por "Instituições Financeiras" (lista de nomes).

- [ ] **Step 1: Reescrever o arquivo completo**

```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProductTypeBadge } from './product-type-badge'

type PartnerRow = {
  financial_partner: { name: string } | null
}

type ProductRow = {
  id: string
  name: string
  type: string
  is_active: boolean
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
              Tipo
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
                  <ProductTypeBadge type={product.type} />
                </td>
                <td className="p-4 align-middle text-muted-foreground">
                  {ifNames || '-'}
                </td>
                <td className="p-4 align-middle">
                  {product.is_active ? (
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
                    <Link href={`/products/${product.id}`}>Exibir</Link>
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

- [ ] **Step 2: Verificar compilação**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
npx tsc --noEmit
```

Resultado esperado: zero erros de TypeScript.

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/app/\(private\)/products/_components/product-table.tsx
git commit -m "feat(admin): atualiza tabela de produtos para exibir lista de IFs"
```

---

## Task 7: Atualizar `CommissionCascade` e `new/page.tsx`

**Files:**
- Modify: `apps/admin/src/components/commissions/commission-cascade.tsx`
- Modify: `apps/admin/src/app/(private)/products/new/page.tsx`

- [ ] **Step 1: Renomear prop `bankPct` → `ifPct` em `commission-cascade.tsx`**

```typescript
type Props = {
  ifPct: number
  velloPct: number
  tenantPct?: number
  velloSpreadPct?: number
  baseValue?: number
}

export function CommissionCascade({
  ifPct,
  velloPct,
  tenantPct,
  velloSpreadPct,
  baseValue = 500_000,
}: Props) {
  const tenantAvailable = ifPct - velloPct

  const formatCurrency = (value: number) =>
    Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      value * (baseValue / 100),
    )

  const formatCompact = (val: number) => {
    if (val >= 1000) {
      return `R$ ${val / 1000}k`
    }
    return Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  return (
    <div className="flex flex-col border border-border rounded-xl overflow-hidden shadow-sm bg-card w-full max-w-sm mx-auto md:mx-0">
      {/* Header */}
      <div className="bg-primary px-6 py-6 text-white w-full">
        <div className="text-[10px] font-bold tracking-widest text-white/80 uppercase mb-1.5">
          Simulação de Repasse
        </div>
        <div className="text-[32px] leading-tight font-extrabold mb-1.5">
          {formatCurrency(ifPct)}
        </div>
        <div className="text-xs text-white/70">
          Estimativa baseada em ticket médio de {formatCompact(baseValue)}
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-6 flex flex-col space-y-5">
        <div className="flex justify-between items-center">
          <span className="text-[15px] text-muted-foreground">
            Comissão Vello ({(velloPct || 0).toFixed(3)}%)
          </span>
          <span className="text-[15px] font-bold text-foreground">
            {formatCurrency(velloPct || 0)}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[15px] text-muted-foreground">
            Comissão Parceiro ({tenantAvailable.toFixed(3)}%)
          </span>
          <span className="text-[15px] font-bold text-foreground">
            {formatCurrency(tenantAvailable)}
          </span>
        </div>

        {tenantPct !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-[15px] text-muted-foreground">
              Comissão do Parceiro ({tenantPct.toFixed(3)}%)
            </span>
            <span className="text-[15px] font-bold text-foreground">
              {formatCurrency(tenantPct)}
            </span>
          </div>
        )}

        {velloSpreadPct !== undefined && (
          <div className="flex justify-between items-center">
            <span className="text-[15px] text-muted-foreground">
              Vello Spread Extra ({velloSpreadPct.toFixed(3)}%)
            </span>
            <span className="text-[15px] font-bold text-foreground">
              {formatCurrency(velloSpreadPct)}
            </span>
          </div>
        )}

        <div className="border-t border-border my-1" />

        <div>
          <div className="flex justify-between items-end mb-2.5">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Taxa de Conversão Est.
            </span>
            <span className="text-xs font-bold text-[#10b981]">Alta (68%)</span>
          </div>
          <div className="flex gap-1 h-1.5">
            <div className="bg-[#10b981] h-full rounded-full w-[68%]" />
            <div className="bg-muted h-full rounded-full flex-1" />
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar descrição em `new/page.tsx`**

Substituir:
```typescript
            <p className="text-muted-foreground mt-2">
              Adicione um novo produto de crédito definindo suas taxas,
              comissionamento e parceiro associado.
            </p>
```

Por:
```typescript
            <p className="text-muted-foreground mt-2">
              Adicione um novo produto de crédito definindo suas taxas e as
              instituições financeiras que o operam.
            </p>
```

- [ ] **Step 3: Verificar compilação final**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
npx tsc --noEmit
```

Resultado esperado: zero erros.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/components/commissions/commission-cascade.tsx \
        apps/admin/src/app/\(private\)/products/new/page.tsx
git commit -m "feat(admin): renomeia bankPct para ifPct em CommissionCascade e atualiza textos"
```

---

## Task 8: Verificação manual no browser

- [ ] **Step 1: Subir o servidor de desenvolvimento**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
pnpm dev
```

- [ ] **Step 2: Verificar listagem de produtos**

Abrir `http://localhost:3000/products`. Confirmar:
- Tabela exibe colunas: Nome · Tipo · Instituições Financeiras · Status · Ações
- Sem erros no console

- [ ] **Step 3: Verificar formulário de criação**

Abrir `http://localhost:3000/products/new`. Confirmar:
- Card "Comissionamento & Rentabilidade" não existe mais
- Card "Instituições Financeiras" aparece com checkboxes das IFs cadastradas
- Ao marcar uma IF, campos de "IF paga à Vello (%)" e "Retenção Vello (%)" aparecem
- Ao desmarcar, campos somem

- [ ] **Step 4: Criar um produto de teste**

Preencher e submeter o formulário com pelo menos uma IF selecionada. Confirmar:
- Redirect para `/products` com toast de sucesso
- Produto aparece na listagem com o nome da IF
- No Supabase, verificar que `product_financial_partners` tem o registro com os percentuais corretos

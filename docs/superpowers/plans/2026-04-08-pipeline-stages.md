# Pipeline Stages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar configuração de pipeline de propostas por tipo de produto — etapas arrastáveis com timeout e triggers de webhook para automações n8n.

**Architecture:** Duas novas tabelas (`proposal_stages`, `stage_triggers`) com RLS via `auth.jwt()`. Rota `/product-types/[id]/pipeline` com Server Component carregando dados e `PipelineEditor` (Client Component) gerenciando estado local para drag-and-drop. Mutações via Server Actions + `router.refresh()` para sincronizar com o servidor. Reorder usa atualização otimista local + reversão em caso de erro.

**Tech Stack:** Next.js 15 App Router, @dnd-kit/core + @dnd-kit/sortable, Supabase (PostgreSQL + RLS), Server Actions, shadcn/ui, Zod, TypeScript.

---

## Arquivos criados / modificados

### Novos
- `supabase/migrations/20260408130000_create_proposal_stages.sql`
- `supabase/migrations/20260408130001_create_stage_triggers.sql`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/page.tsx`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/pipeline-queries.ts`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/pipeline-actions.ts`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/pipeline-editor.tsx`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/sortable-stage-card.tsx`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/stage-trigger-row.tsx`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/add-stage-form.tsx`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/add-trigger-form.tsx`
- `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/duplicate-stages-select.tsx`

### Modificados
- `packages/database/src/types.ts` — adicionar `proposal_stages` e `stage_triggers`
- `apps/admin/package.json` — adicionar `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`
- `apps/admin/src/app/(private)/product-types/_components/product-type-table.tsx` — botão "Pipeline" na tabela

---

## Task 1: Instalar dependências dnd-kit

**Files:**
- Modify: `apps/admin/package.json`

- [ ] **Step 1: Instalar pacotes**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance
pnpm --filter admin add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

Esperado: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` adicionados em `apps/admin/package.json`.

- [ ] **Step 2: Commit**

```bash
git add apps/admin/package.json pnpm-lock.yaml
git commit -m "chore(admin): adiciona dependências @dnd-kit para pipeline"
```

---

## Task 2: Migrations — `proposal_stages` e `stage_triggers`

**Files:**
- Create: `supabase/migrations/20260408130000_create_proposal_stages.sql`
- Create: `supabase/migrations/20260408130001_create_stage_triggers.sql`

- [ ] **Step 1: Criar migration de proposal_stages**

```sql
-- supabase/migrations/20260408130000_create_proposal_stages.sql
-- Etapas de pipeline por tipo de produto.
-- RLS: backoffice gerencia; tenants leem etapas de tipos ativos.

CREATE TABLE proposal_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  order_num       INTEGER NOT NULL,
  timeout_unit    VARCHAR(10) CHECK (timeout_unit IN ('minutes', 'hours', 'days')),
  timeout_value   INTEGER CHECK (timeout_value IS NULL OR timeout_value > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_type_id, order_num)
);

CREATE TRIGGER set_updated_at_proposal_stages
  BEFORE UPDATE ON proposal_stages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_proposal_stages_product_order
  ON proposal_stages(product_type_id, order_num);

-- RLS
ALTER TABLE proposal_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON proposal_stages
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_read_active_pipeline" ON proposal_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_types pt
      WHERE pt.id = product_type_id
        AND pt.is_active = true
    )
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );
```

- [ ] **Step 2: Criar migration de stage_triggers**

```sql
-- supabase/migrations/20260408130001_create_stage_triggers.sql
-- Triggers de webhook disparados em eventos de etapas de pipeline.
-- RLS: backoffice apenas — triggers são automações internas.

CREATE TABLE stage_triggers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id         UUID NOT NULL REFERENCES proposal_stages(id) ON DELETE CASCADE,
  event_type       VARCHAR(20) NOT NULL CHECK (event_type IN ('on_enter', 'on_exit', 'on_timeout')),
  webhook_url      TEXT NOT NULL,
  payload_template JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_stage_triggers_stage_event
  ON stage_triggers(stage_id, event_type);

-- RLS
ALTER TABLE stage_triggers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON stage_triggers
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260408130000_create_proposal_stages.sql \
        supabase/migrations/20260408130001_create_stage_triggers.sql
git commit -m "feat(supabase): cria tabelas proposal_stages e stage_triggers"
```

---

## Task 3: Atualizar `packages/database/src/types.ts`

**Files:**
- Modify: `packages/database/src/types.ts`

- [ ] **Step 1: Adicionar `proposal_stages` e `stage_triggers` ao types.ts**

Inserir logo após o bloco `product_types` (antes de `products`), na seção `public > Tables`:

```ts
      proposal_stages: {
        Row: {
          created_at: string
          id: string
          name: string
          order_num: number
          product_type_id: string
          timeout_unit: string | null
          timeout_value: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_num: number
          product_type_id: string
          timeout_unit?: string | null
          timeout_value?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_num?: number
          product_type_id?: string
          timeout_unit?: string | null
          timeout_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_stages_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_triggers: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload_template: Json | null
          stage_id: string
          webhook_url: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload_template?: Json | null
          stage_id: string
          webhook_url: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload_template?: Json | null
          stage_id?: string
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_triggers_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "proposal_stages"
            referencedColumns: ["id"]
          },
        ]
      }
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
npx tsc --noEmit
```

Esperado: nenhum erro.

- [ ] **Step 3: Commit**

```bash
git add packages/database/src/types.ts
git commit -m "feat(packages/database): adiciona tipos proposal_stages e stage_triggers"
```

---

## Task 4: Queries e Actions de pipeline

**Files:**
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/pipeline-queries.ts`
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/pipeline-actions.ts`

- [ ] **Step 1: Criar `pipeline-queries.ts`**

```ts
// apps/admin/src/app/(private)/product-types/[id]/pipeline/pipeline-queries.ts
import { createClient } from '@/lib/supabase/server'

export type StageTrigger = {
  id: string
  event_type: string
  webhook_url: string
  payload_template: unknown | null
}

export type PipelineStage = {
  id: string
  name: string
  order_num: number
  timeout_unit: string | null
  timeout_value: number | null
  stage_triggers: StageTrigger[]
}

export async function getProductTypePipeline(productTypeId: string): Promise<PipelineStage[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proposal_stages')
    .select(`
      id,
      name,
      order_num,
      timeout_unit,
      timeout_value,
      stage_triggers(id, event_type, webhook_url, payload_template)
    `)
    .eq('product_type_id', productTypeId)
    .order('order_num')

  if (error) throw error
  return data as PipelineStage[]
}
```

- [ ] **Step 2: Criar `pipeline-actions.ts`**

```ts
// apps/admin/src/app/(private)/product-types/[id]/pipeline/pipeline-actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'

// ─── Stage Actions ─────────────────────────────────────────────────────────

const stageSchema = z.object({
  product_type_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  timeout_unit: z.enum(['minutes', 'hours', 'days']).nullable().optional(),
  timeout_value: z.coerce.number().int().positive().nullable().optional(),
})

export async function createStage(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === 'null') obj[key] = null
  }

  const parsed = stageSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const supabase = await createClient()

  // Determinar o próximo order_num
  const { data: last, error: countError } = await supabase
    .from('proposal_stages')
    .select('order_num')
    .eq('product_type_id', parsed.data.product_type_id)
    .order('order_num', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (countError) return { success: false, message: countError.message, errors: null }

  const nextOrder = (last?.order_num ?? 0) + 1

  const { data: stage, error } = await supabase
    .from('proposal_stages')
    .insert({
      product_type_id: parsed.data.product_type_id,
      name: parsed.data.name,
      order_num: nextOrder,
      timeout_unit: parsed.data.timeout_unit ?? null,
      timeout_value: parsed.data.timeout_value ?? null,
    })
    .select('id, name, order_num, timeout_unit, timeout_value')
    .single()

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath(`/product-types/${parsed.data.product_type_id}/pipeline`)
  return { success: true, message: 'Etapa criada.', errors: null, data: stage as Record<string, unknown> }
}

const stageUpdateSchema = z.object({
  stage_id: z.string().uuid(),
  product_type_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  timeout_unit: z.enum(['minutes', 'hours', 'days']).nullable().optional(),
  timeout_value: z.coerce.number().int().positive().nullable().optional(),
})

export async function updateStage(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === '' || value === 'null') obj[key] = null
  }

  const parsed = stageUpdateSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Dados inválidos.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proposal_stages')
    .update({
      name: parsed.data.name,
      timeout_unit: parsed.data.timeout_unit ?? null,
      timeout_value: parsed.data.timeout_value ?? null,
    })
    .eq('id', parsed.data.stage_id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath(`/product-types/${parsed.data.product_type_id}/pipeline`)
  return { success: true, message: 'Etapa atualizada.', errors: null }
}

export async function deleteStage(stageId: string, productTypeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('proposal_stages')
    .delete()
    .eq('id', stageId)

  if (error) return { success: false, message: error.message }

  revalidatePath(`/product-types/${productTypeId}/pipeline`)
  return { success: true, message: '' }
}

export async function reorderStages(productTypeId: string, orderedIds: string[]) {
  const supabase = await createClient()

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('proposal_stages')
      .update({ order_num: index + 1 })
      .eq('id', id),
  )

  const results = await Promise.all(updates)
  const firstError = results.find((r) => r.error)

  if (firstError?.error) return { success: false, message: firstError.error.message }

  revalidatePath(`/product-types/${productTypeId}/pipeline`)
  return { success: true, message: '' }
}

export async function duplicateStagesFrom(
  targetProductTypeId: string,
  sourceProductTypeId: string,
) {
  const supabase = await createClient()

  // Buscar etapas da fonte (sem triggers)
  const { data: sourceStages, error: fetchError } = await supabase
    .from('proposal_stages')
    .select('name, order_num, timeout_unit, timeout_value')
    .eq('product_type_id', sourceProductTypeId)
    .order('order_num')

  if (fetchError) return { success: false, message: fetchError.message }
  if (!sourceStages || sourceStages.length === 0) {
    return { success: false, message: 'Tipo de origem não possui etapas.' }
  }

  // Determinar offset para order_num (adiciona após etapas existentes)
  const { data: last } = await supabase
    .from('proposal_stages')
    .select('order_num')
    .eq('product_type_id', targetProductTypeId)
    .order('order_num', { ascending: false })
    .limit(1)
    .maybeSingle()

  const offset = last?.order_num ?? 0

  const rows = sourceStages.map((s) => ({
    product_type_id: targetProductTypeId,
    name: s.name,
    order_num: s.order_num + offset,
    timeout_unit: s.timeout_unit,
    timeout_value: s.timeout_value,
  }))

  const { error: insertError } = await supabase.from('proposal_stages').insert(rows)
  if (insertError) return { success: false, message: insertError.message }

  revalidatePath(`/product-types/${targetProductTypeId}/pipeline`)
  return { success: true, message: `${rows.length} etapas duplicadas com sucesso.` }
}

// ─── Trigger Actions ────────────────────────────────────────────────────────

const triggerSchema = z.object({
  stage_id: z.string().uuid(),
  product_type_id: z.string().uuid(),
  event_type: z.enum(['on_enter', 'on_exit', 'on_timeout']),
  webhook_url: z.string().url('URL de webhook inválida.'),
  payload_template: z.string().optional().nullable(),
})

export async function createTrigger(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const parsed = triggerSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os dados do trigger.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  // Validar JSON do payload_template se fornecido
  let payloadJson: unknown = null
  if (parsed.data.payload_template) {
    try {
      payloadJson = JSON.parse(parsed.data.payload_template)
    } catch {
      return {
        success: false,
        message: 'Payload template deve ser JSON válido.',
        errors: null,
      }
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('stage_triggers').insert({
    stage_id: parsed.data.stage_id,
    event_type: parsed.data.event_type,
    webhook_url: parsed.data.webhook_url,
    payload_template: payloadJson,
  })

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath(`/product-types/${parsed.data.product_type_id}/pipeline`)
  return { success: true, message: 'Trigger criado.', errors: null }
}

export async function deleteTrigger(triggerId: string, productTypeId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('stage_triggers')
    .delete()
    .eq('id', triggerId)

  if (error) return { success: false, message: error.message }

  revalidatePath(`/product-types/${productTypeId}/pipeline`)
  return { success: true, message: '' }
}
```

- [ ] **Step 3: Commit**

```bash
git add "apps/admin/src/app/(private)/product-types/[id]/pipeline/pipeline-queries.ts" \
        "apps/admin/src/app/(private)/product-types/[id]/pipeline/pipeline-actions.ts"
git commit -m "feat(admin): adiciona queries e actions do pipeline de etapas"
```

---

## Task 5: Componentes do pipeline — partes atômicas

**Files:**
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/stage-trigger-row.tsx`
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/add-trigger-form.tsx`
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/add-stage-form.tsx`
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/duplicate-stages-select.tsx`

- [ ] **Step 1: Criar `stage-trigger-row.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/stage-trigger-row.tsx
'use client'

import { Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { deleteTrigger } from '../pipeline-actions'

const EVENT_LABEL: Record<string, string> = {
  on_enter: 'Ao entrar',
  on_exit: 'Ao sair',
  on_timeout: 'Timeout',
}

type Props = {
  trigger: {
    id: string
    event_type: string
    webhook_url: string
  }
  productTypeId: string
}

export function StageTriggerRow({ trigger, productTypeId }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTrigger(trigger.id, productTypeId)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.message || 'Erro ao remover trigger.')
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-2 py-1 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0 text-xs font-medium bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
          {EVENT_LABEL[trigger.event_type] ?? trigger.event_type}
        </span>
        <span className="text-muted-foreground truncate font-mono text-xs">
          {trigger.webhook_url}
        </span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={isPending}
        onClick={handleDelete}
        className="shrink-0 h-7 w-7 p-0 text-destructive hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Criar `add-trigger-form.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/add-trigger-form.tsx
'use client'

import { Plus, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'

import { createTrigger } from '../pipeline-actions'

const EVENT_OPTIONS = [
  { value: 'on_enter', label: 'Ao entrar na etapa' },
  { value: 'on_exit', label: 'Ao sair da etapa' },
  { value: 'on_timeout', label: 'Ao atingir timeout' },
]

type Props = {
  stageId: string
  productTypeId: string
}

export function AddTriggerForm({ stageId, productTypeId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [formState, handleSubmit, isPending] = useFormState(
    createTrigger,
    () => {
      toast.success('Trigger adicionado.')
      setOpen(false)
      router.refresh()
    },
    (msg) => toast.error(msg),
  )

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs gap-1 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-3" />
        Novo trigger
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-dashed rounded-md p-3 space-y-3 mt-2">
      <input type="hidden" name="stage_id" value={stageId} />
      <input type="hidden" name="product_type_id" value={productTypeId} />

      <FieldGroup className="grid grid-cols-1 gap-2">
        <Field>
          <FieldLabel htmlFor={`event_type_${stageId}`} className="text-xs">
            Evento *
          </FieldLabel>
          <select
            id={`event_type_${stageId}`}
            name="event_type"
            required
            className="flex h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">Selecione...</option>
            {EVENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <FieldError errors={formState.errors?.event_type} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`webhook_url_${stageId}`} className="text-xs">
            URL do Webhook *
          </FieldLabel>
          <Input
            id={`webhook_url_${stageId}`}
            name="webhook_url"
            required
            placeholder="https://n8n.sua-empresa.com/webhook/..."
            className="h-8 text-xs"
          />
          <FieldError errors={formState.errors?.webhook_url} />
        </Field>

        <Field>
          <FieldLabel htmlFor={`payload_template_${stageId}`} className="text-xs">
            Payload Template (JSON opcional)
          </FieldLabel>
          <textarea
            id={`payload_template_${stageId}`}
            name="payload_template"
            placeholder='{"chave": "valor"}'
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
          />
          <FieldError errors={formState.errors?.payload_template} />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setOpen(false)}
        >
          <X className="size-3" />
          Cancelar
        </Button>
        <Button type="submit" size="sm" className="h-7 text-xs" disabled={isPending}>
          Salvar
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Criar `add-stage-form.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/add-stage-form.tsx
'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'

import { createStage } from '../pipeline-actions'

type Props = {
  productTypeId: string
}

export function AddStageForm({ productTypeId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [formState, handleSubmit, isPending] = useFormState(
    createStage,
    () => {
      toast.success('Etapa criada.')
      setOpen(false)
      router.refresh()
    },
    (msg) => toast.error(msg),
  )

  if (!open) {
    return (
      <Button
        variant="outline"
        className="w-full border-dashed gap-2"
        onClick={() => setOpen(true)}
      >
        <Plus className="size-4" />
        Nova Etapa
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="border border-dashed rounded-lg p-4 space-y-4">
      <input type="hidden" name="product_type_id" value={productTypeId} />

      <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field className="col-span-full md:col-span-1">
          <FieldLabel htmlFor="stage_name">Nome da Etapa *</FieldLabel>
          <Input
            id="stage_name"
            name="name"
            required
            autoFocus
            placeholder="Ex: Aguardando Documentos"
          />
          <FieldError errors={formState.errors?.name} />
        </Field>

        <Field>
          <FieldLabel htmlFor="stage_timeout">Timeout (opcional)</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="stage_timeout"
              name="timeout_value"
              type="number"
              min="1"
              placeholder="Ex: 3"
              className="w-24"
            />
            <select
              name="timeout_unit"
              className="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="null">Sem timeout</option>
              <option value="minutes">Minutos</option>
              <option value="hours">Horas</option>
              <option value="days">Dias</option>
            </select>
          </div>
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          Criar Etapa
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 4: Criar `duplicate-stages-select.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/duplicate-stages-select.tsx
'use client'

import { Copy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'

import { duplicateStagesFrom } from '../pipeline-actions'

type ProductTypeOption = { id: string; name: string }

type Props = {
  productTypeId: string
  otherProductTypes: ProductTypeOption[]
}

export function DuplicateStagesSelect({ productTypeId, otherProductTypes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const sourceId = e.target.value
    if (!sourceId) return

    e.target.value = '' // reset select

    startTransition(async () => {
      const result = await duplicateStagesFrom(productTypeId, sourceId)
      if (result.success) {
        toast.success(result.message || 'Etapas duplicadas.')
        router.refresh()
      } else {
        toast.error(result.message || 'Erro ao duplicar etapas.')
      }
    })
  }

  if (otherProductTypes.length === 0) return null

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Copy className="size-4 shrink-0" />
      <span className="shrink-0">Duplicar etapas de:</span>
      <select
        disabled={isPending}
        onChange={handleChange}
        defaultValue=""
        className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
      >
        <option value="">Selecione um tipo...</option>
        {otherProductTypes.map((pt) => (
          <option key={pt.id} value={pt.id}>
            {pt.name}
          </option>
        ))}
      </select>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add "apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/"
git commit -m "feat(admin): adiciona componentes atômicos do pipeline (triggers, stages, duplicate)"
```

---

## Task 6: Componente principal `SortableStageCard`

**Files:**
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/sortable-stage-card.tsx`

- [ ] **Step 1: Criar `sortable-stage-card.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/sortable-stage-card.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Loader2, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useFormState } from '@/hooks/use-form-state'

import { deleteStage, updateStage } from '../pipeline-actions'
import { AddTriggerForm } from './add-trigger-form'
import { StageTriggerRow } from './stage-trigger-row'

import type { PipelineStage } from '../pipeline-queries'

const TIMEOUT_UNIT_LABEL: Record<string, string> = {
  minutes: 'min',
  hours: 'h',
  days: 'dias',
}

type Props = {
  stage: PipelineStage
  index: number
  productTypeId: string
}

export function SortableStageCard({ stage, index, productTypeId }: Props) {
  const router = useRouter()
  const [isDeleting, startDeleteTransition] = useTransition()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [, handleUpdateSubmit, isUpdating] = useFormState(
    updateStage,
    () => router.refresh(),
    (msg) => toast.error(msg),
  )

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteStage(stage.id, productTypeId)
      if (result.success) {
        router.refresh()
      } else {
        toast.error(result.message || 'Erro ao remover etapa.')
      }
    })
  }

  const timeoutLabel = stage.timeout_value && stage.timeout_unit
    ? `${stage.timeout_value} ${TIMEOUT_UNIT_LABEL[stage.timeout_unit] ?? stage.timeout_unit}`
    : 'Sem timeout'

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="bg-card">
        <CardHeader className="pb-2 border-b flex-row items-center gap-2">
          {/* drag handle */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-1 rounded"
            aria-label="Arrastar etapa"
          >
            <GripVertical className="size-4" />
          </button>

          <span className="text-xs font-medium text-muted-foreground w-5 shrink-0">
            {index + 1}.
          </span>

          <form onSubmit={handleUpdateSubmit} className="flex-1 flex items-center gap-3">
            <input type="hidden" name="stage_id" value={stage.id} />
            <input type="hidden" name="product_type_id" value={productTypeId} />

            <Field className="flex-1 mb-0">
              <Input
                name="name"
                defaultValue={stage.name}
                className="h-8 text-sm font-medium"
                required
                onBlur={(e) => {
                  if (e.target.value !== stage.name) {
                    e.target.form?.requestSubmit()
                  }
                }}
              />
            </Field>

            <div className="flex items-center gap-1 shrink-0">
              <FieldLabel className="text-xs text-muted-foreground whitespace-nowrap">
                Timeout:
              </FieldLabel>
              <div className="flex items-center gap-1">
                <Input
                  name="timeout_value"
                  type="number"
                  min="1"
                  defaultValue={stage.timeout_value ?? ''}
                  placeholder="—"
                  className="h-8 w-16 text-xs text-center"
                />
                <select
                  name="timeout_unit"
                  defaultValue={stage.timeout_unit ?? 'null'}
                  onChange={(e) => {
                    // auto-submit ao mudar a unidade
                    e.target.form?.requestSubmit()
                  }}
                  className="h-8 rounded-md border border-input bg-background px-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="null">—</option>
                  <option value="minutes">min</option>
                  <option value="hours">h</option>
                  <option value="days">dias</option>
                </select>
              </div>
            </div>

            {isUpdating && <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />}
          </form>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={handleDelete}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive shrink-0"
          >
            {isDeleting
              ? <Loader2 className="size-4 animate-spin" />
              : <Trash2 className="size-4" />
            }
          </Button>
        </CardHeader>

        <CardContent className="pt-3 pb-3">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Triggers ({stage.stage_triggers.length})
            </p>

            {stage.stage_triggers.length > 0 ? (
              <div className="space-y-0.5">
                {stage.stage_triggers.map((trigger) => (
                  <StageTriggerRow
                    key={trigger.id}
                    trigger={trigger}
                    productTypeId={productTypeId}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Nenhum trigger configurado.</p>
            )}

            <AddTriggerForm stageId={stage.id} productTypeId={productTypeId} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add "apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/sortable-stage-card.tsx"
git commit -m "feat(admin): adiciona SortableStageCard com drag handle e inline edit"
```

---

## Task 7: Componente `PipelineEditor` e página `/pipeline`

**Files:**
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/pipeline-editor.tsx`
- Create: `apps/admin/src/app/(private)/product-types/[id]/pipeline/page.tsx`

- [ ] **Step 1: Criar `pipeline-editor.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/pipeline-editor.tsx
'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { reorderStages } from '../pipeline-actions'
import type { PipelineStage } from '../pipeline-queries'
import { AddStageForm } from './add-stage-form'
import { DuplicateStagesSelect } from './duplicate-stages-select'
import { SortableStageCard } from './sortable-stage-card'

type ProductTypeOption = { id: string; name: string }

type Props = {
  productTypeId: string
  initialStages: PipelineStage[]
  otherProductTypes: ProductTypeOption[]
}

export function PipelineEditor({ productTypeId, initialStages, otherProductTypes }: Props) {
  const router = useRouter()
  const [stages, setStages] = useState(initialStages)
  const [isReordering, startReorderTransition] = useTransition()

  // Sincroniza estado local quando o Server Component atualiza os dados
  useEffect(() => {
    setStages(initialStages)
  }, [initialStages])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = stages.findIndex((s) => s.id === active.id)
    const newIndex = stages.findIndex((s) => s.id === over.id)
    const newStages = arrayMove(stages, oldIndex, newIndex)

    setStages(newStages) // otimista

    startReorderTransition(async () => {
      const result = await reorderStages(productTypeId, newStages.map((s) => s.id))
      if (!result.success) {
        toast.error(result.message || 'Erro ao reordenar etapas.')
        setStages(stages) // reverte
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-4">
      {stages.length === 0 && (
        <div className="flex items-center justify-center h-32 border border-dashed rounded-lg text-muted-foreground text-sm">
          Nenhuma etapa configurada. Adicione a primeira abaixo.
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {stages.map((stage, index) => (
              <SortableStageCard
                key={stage.id}
                stage={stage}
                index={index}
                productTypeId={productTypeId}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <AddStageForm productTypeId={productTypeId} />

      <div className="pt-2 border-t">
        <DuplicateStagesSelect
          productTypeId={productTypeId}
          otherProductTypes={otherProductTypes}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar `page.tsx`**

```tsx
// apps/admin/src/app/(private)/product-types/[id]/pipeline/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Button } from '@/components/ui/button'

import { getProductType, listProductTypes } from '../../../queries'
import { getProductTypePipeline } from './pipeline-queries'
import { PipelineEditor } from './_components/pipeline-editor'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const productType = await getProductType(id).catch(() => null)
  return { title: productType ? `Pipeline — ${productType.name}` : 'Pipeline' }
}

export default async function PipelinePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [productType, stages, allProductTypes] = await Promise.all([
    getProductType(id).catch(() => null),
    getProductTypePipeline(id),
    listProductTypes(true),
  ])

  if (!productType) notFound()

  const otherProductTypes = allProductTypes.filter((pt) => pt.id !== id)

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/product-types" className="hover:underline">
              Tipos de Produto
            </Link>
            <span>/</span>
            <span>{productType.name}</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Etapas da Esteira
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure as etapas do pipeline de propostas para{' '}
            <strong>{productType.name}</strong>.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/product-types/${id}/edit`}>Editar Tipo</Link>
        </Button>
      </div>

      <PipelineEditor
        productTypeId={id}
        initialStages={stages}
        otherProductTypes={otherProductTypes}
      />
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add "apps/admin/src/app/(private)/product-types/[id]/pipeline/_components/pipeline-editor.tsx" \
        "apps/admin/src/app/(private)/product-types/[id]/pipeline/page.tsx"
git commit -m "feat(admin): adiciona PipelineEditor e página de pipeline por tipo de produto"
```

---

## Task 8: Adicionar botão "Pipeline" na tabela de tipos

**Files:**
- Modify: `apps/admin/src/app/(private)/product-types/_components/product-type-table.tsx`

- [ ] **Step 1: Adicionar import e coluna de ações com Pipeline**

No arquivo `product-type-table.tsx`, adicionar `GitBranch` ao import do lucide e um segundo botão de ação ao lado do "Editar":

```tsx
// Adicionar ao import:
import { GitBranch, Pencil } from 'lucide-react'

// Adicionar coluna no thead (após Status, antes de Ações — ou substituir Ações):
// Manter coluna Ações, mas adicionar botão Pipeline ao lado de Editar:

<td className="p-4 align-middle text-right">
  <div className="flex items-center justify-end gap-1">
    <Button variant="ghost" size="sm" asChild>
      <Link href={`/product-types/${pt.id}/pipeline`}>
        <GitBranch className="size-4" />
      </Link>
    </Button>
    <Button variant="ghost" size="sm" asChild>
      <Link href={`/product-types/${pt.id}/edit`}>
        <Pencil className="size-4" />
      </Link>
    </Button>
  </div>
</td>
```

- [ ] **Step 2: Verificar TypeScript**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
npx tsc --noEmit
```

Esperado: nenhum erro.

- [ ] **Step 3: Commit**

```bash
git add "apps/admin/src/app/(private)/product-types/_components/product-type-table.tsx"
git commit -m "feat(admin): adiciona botão de pipeline na tabela de tipos de produto"
```

---

## Verificação final

- [ ] `npx tsc --noEmit` passa sem erros em `apps/admin`
- [ ] Página `/product-types` exibe botões Pipeline e Editar para cada tipo
- [ ] `/product-types/[id]/pipeline` carrega etapas do banco
- [ ] Adicionar nova etapa via formulário inline funciona
- [ ] Editar nome da etapa no blur salva automaticamente
- [ ] Mudar timeout unit auto-salva via `requestSubmit`
- [ ] Deletar etapa funciona (cascata remove triggers)
- [ ] Drag & drop reordena etapas com atualização otimista
- [ ] Adicionar trigger com URL e evento funciona
- [ ] Deletar trigger funciona
- [ ] Duplicar etapas de outro tipo funciona (sem triggers)
- [ ] `Duplicar de` não aparece se não há outros tipos ativos

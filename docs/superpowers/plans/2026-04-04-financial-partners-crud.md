# CRUD de Instituições Financeiras — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar CRUD completo de Instituições Financeiras em `apps/admin`, com controle de visibilidade de campos sensíveis por role (`super_admin`).

**Architecture:** Server Components buscam dados e role do usuário no servidor; Client Components recebem dados via props; Server Actions são o único ponto de mutação. Formulário único reutilizado em criar/editar via prop `partner`. Campos sensíveis (`api_key_enc`, `webhook_secret`) renderizados apenas se `isSuperAdmin === true`.

**Tech Stack:** Next.js 15 App Router, TypeScript, Supabase (PostgreSQL + RLS), Zod, shadcn/ui, `useFormState` hook

---

## Mapa de Arquivos

| Arquivo | Ação |
|---|---|
| `apps/admin/src/app/(private)/financial-partners/queries.ts` | Criar |
| `apps/admin/src/app/(private)/financial-partners/actions.ts` | Criar |
| `apps/admin/src/app/(private)/financial-partners/page.tsx` | Criar |
| `apps/admin/src/app/(private)/financial-partners/new/page.tsx` | Criar |
| `apps/admin/src/app/(private)/financial-partners/[id]/edit/page.tsx` | Criar |
| `apps/admin/src/app/(private)/financial-partners/_components/financial-partner-table.tsx` | Criar |
| `apps/admin/src/app/(private)/financial-partners/_components/financial-partner-form.tsx` | Criar |
| `apps/admin/src/components/sidebar/nav-main.tsx` | Modificar (renomear label) |

---

## Task 1: `queries.ts`

**Files:**
- Create: `apps/admin/src/app/(private)/financial-partners/queries.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
import { createClient } from '@/lib/supabase/server'

export async function listFinancialPartners() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_partners')
    .select('id, name, type, api_base_url, is_active')
    .order('name')
  if (error) throw error
  return data
}

export async function getFinancialPartner(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('financial_partners')
    .select('id, name, type, api_base_url, api_key_enc, webhook_secret, is_active')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getCurrentUserRole(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null
  try {
    const payload = JSON.parse(atob(session.access_token.split('.')[1])) as { role?: string }
    return payload.role ?? null
  } catch {
    return null
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/financial-partners/queries.ts
git commit -m "feat(admin): adiciona queries de instituições financeiras"
```

---

## Task 2: `actions.ts`

**Files:**
- Create: `apps/admin/src/app/(private)/financial-partners/actions.ts`

- [ ] **Step 1: Criar o arquivo**

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { getCurrentUserRole } from './queries'

const baseSchema = z.object({
  name: z.string().min(2).max(100),
  type: z.enum(['qi_tech', 'bancly', 'zip', 'other']),
  api_base_url: z.string().url().optional().nullable(),
  is_active: z.boolean().default(true),
})

const sensitiveSchema = z.object({
  api_key_enc: z.string().optional().nullable(),
  webhook_secret: z.string().optional().nullable(),
})

export async function createFinancialPartner(data: FormData) {
  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const baseResult = baseSchema.safeParse(obj)
  if (!baseResult.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(baseResult.error).fieldErrors,
    }
  }

  const role = await getCurrentUserRole()
  const payload: Record<string, unknown> = { ...baseResult.data }

  if (role === 'super_admin') {
    const sensitiveResult = sensitiveSchema.safeParse(obj)
    if (sensitiveResult.success) {
      if (sensitiveResult.data.api_key_enc) payload.api_key_enc = sensitiveResult.data.api_key_enc
      if (sensitiveResult.data.webhook_secret) payload.webhook_secret = sensitiveResult.data.webhook_secret
    }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('financial_partners').insert(payload)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/financial-partners')
  return { success: true, message: 'Instituição financeira cadastrada com sucesso!', errors: null }
}

export async function updateFinancialPartner(data: FormData) {
  const id = data.get('id') as string
  if (!id) return { success: false, message: 'ID não informado.', errors: null }

  const obj = Object.fromEntries(data) as Record<string, unknown>
  obj.is_active = obj.is_active === 'on' || obj.is_active === 'true'
  for (const [key, value] of Object.entries(obj)) {
    if (value === '') obj[key] = null
  }

  const baseResult = baseSchema.safeParse(obj)
  if (!baseResult.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(baseResult.error).fieldErrors,
    }
  }

  const role = await getCurrentUserRole()
  const payload: Record<string, unknown> = { ...baseResult.data }

  if (role === 'super_admin') {
    const sensitiveResult = sensitiveSchema.safeParse(obj)
    if (sensitiveResult.success) {
      // Só atualiza se o usuário digitou um novo valor (não placeholder vazio)
      if (sensitiveResult.data.api_key_enc) payload.api_key_enc = sensitiveResult.data.api_key_enc
      if (sensitiveResult.data.webhook_secret) payload.webhook_secret = sensitiveResult.data.webhook_secret
    }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('financial_partners')
    .update(payload)
    .eq('id', id)

  if (error) return { success: false, message: error.message, errors: null }

  revalidatePath('/financial-partners')
  return { success: true, message: 'Instituição financeira atualizada com sucesso!', errors: null }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/financial-partners/actions.ts
git commit -m "feat(admin): adiciona actions de instituições financeiras com controle de role"
```

---

## Task 3: `_components/financial-partner-table.tsx`

**Files:**
- Create: `apps/admin/src/app/(private)/financial-partners/_components/financial-partner-table.tsx`

- [ ] **Step 1: Criar o arquivo**

```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

const TYPE_LABELS: Record<string, string> = {
  qi_tech: 'QI Tech',
  bancly: 'Bancly',
  zip: 'Zip',
  other: 'Outro',
}

type PartnerRow = {
  id: string
  name: string
  type: string
  api_base_url: string | null
  is_active: boolean
}

export function FinancialPartnerTable({
  partners,
}: {
  partners: ReadonlyArray<PartnerRow>
}) {
  if (!partners || partners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhuma instituição financeira cadastrada.</p>
        <Button variant="link" asChild className="mt-2">
          <Link href="/financial-partners/new">Cadastrar a primeira</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-auto rounded-md border bg-card">
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b">
          <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nome</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tipo</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">URL da API</th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
            <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Ações</th>
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {partners.map((partner) => (
            <tr
              key={partner.id}
              className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
            >
              <td className="p-4 align-middle font-medium">{partner.name}</td>
              <td className="p-4 align-middle">{TYPE_LABELS[partner.type] ?? partner.type}</td>
              <td className="p-4 align-middle text-muted-foreground text-xs">
                {partner.api_base_url ?? '-'}
              </td>
              <td className="p-4 align-middle">
                {partner.is_active ? (
                  <span className="text-2xs bg-green-100 text-green-800 px-2 py-0.5 rounded">Ativo</span>
                ) : (
                  <span className="text-2xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Inativo</span>
                )}
              </td>
              <td className="p-4 align-middle text-right">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/financial-partners/${partner.id}/edit`}>Editar</Link>
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

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/\(private\)/financial-partners/_components/financial-partner-table.tsx
git commit -m "feat(admin): adiciona tabela de instituições financeiras"
```

---

## Task 4: `_components/financial-partner-form.tsx`

**Files:**
- Create: `apps/admin/src/app/(private)/financial-partners/_components/financial-partner-form.tsx`

- [ ] **Step 1: Criar o arquivo**

```typescript
'use client'

import { KeyRound, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useFormState } from '@/hooks/use-form-state'

import { createFinancialPartner, updateFinancialPartner } from '../actions'

type FinancialPartner = {
  id: string
  name: string
  type: string
  api_base_url: string | null
  api_key_enc: string | null
  webhook_secret: string | null
  is_active: boolean
}

type Props = {
  partner?: FinancialPartner
  isSuperAdmin: boolean
}

const TYPE_OPTIONS = [
  { value: 'qi_tech', label: 'QI Tech' },
  { value: 'bancly', label: 'Bancly' },
  { value: 'zip', label: 'Zip' },
  { value: 'other', label: 'Outro' },
]

export function FinancialPartnerForm({ partner, isSuperAdmin }: Props) {
  const router = useRouter()
  const isEdit = !!partner

  const action = isEdit ? updateFinancialPartner : createFinancialPartner

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(isEdit ? 'Instituição atualizada com sucesso!' : 'Instituição cadastrada com sucesso!')
      router.push('/financial-partners')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={partner.id} />}

      {/* Card 1 — Identificação */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Identificação</CardTitle>
          <CardDescription>
            Dados principais da instituição financeira.
          </CardDescription>
          <CardAction className="my-auto">
            <div className="flex items-center space-x-2">
              <FieldLabel htmlFor="is_active" className="cursor-pointer">
                Ativo
              </FieldLabel>
              <Switch
                id="is_active"
                name="is_active"
                defaultChecked={partner?.is_active ?? true}
              />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="name">Nome *</FieldLabel>
              <Input
                id="name"
                name="name"
                required
                placeholder="Ex: QI Tech"
                defaultValue={partner?.name ?? ''}
              />
              <FieldError errors={formState.errors?.name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="type">Tipo *</FieldLabel>
              <select
                id="type"
                name="type"
                required
                defaultValue={partner?.type ?? ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Selecione...</option>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FieldError errors={formState.errors?.type} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 2 — Integração */}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Integração</CardTitle>
          <CardDescription>
            Configurações de conexão com a API da instituição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="api_base_url">URL da API</FieldLabel>
              <Input
                id="api_base_url"
                name="api_base_url"
                type="url"
                placeholder="https://api.exemplo.com"
                defaultValue={partner?.api_base_url ?? ''}
              />
              <FieldError errors={formState.errors?.api_base_url} />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Card 3 — Segurança (apenas super_admin) */}
      {isSuperAdmin && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-4" />
              Segurança
            </CardTitle>
            <CardDescription>
              Credenciais sensíveis — visíveis apenas para super_admin.
              {isEdit && ' Deixe em branco para manter os valores atuais.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="api_key_enc">Chave de API</FieldLabel>
                <Input
                  id="api_key_enc"
                  name="api_key_enc"
                  type="password"
                  placeholder={isEdit ? '••••••••' : 'Chave de acesso à API'}
                  autoComplete="off"
                />
                <FieldError errors={formState.errors?.api_key_enc} />
              </Field>

              <Field>
                <FieldLabel htmlFor="webhook_secret">Webhook Secret</FieldLabel>
                <Input
                  id="webhook_secret"
                  name="webhook_secret"
                  type="password"
                  placeholder={isEdit ? '••••••••' : 'Secret para validar webhooks'}
                  autoComplete="off"
                />
                <FieldError errors={formState.errors?.webhook_secret} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/financial-partners')}
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
git add apps/admin/src/app/\(private\)/financial-partners/_components/financial-partner-form.tsx
git commit -m "feat(admin): adiciona formulário de instituição financeira com controle de campos sensíveis"
```

---

## Task 5: Páginas — Listagem, Criar e Editar

**Files:**
- Create: `apps/admin/src/app/(private)/financial-partners/page.tsx`
- Create: `apps/admin/src/app/(private)/financial-partners/new/page.tsx`
- Create: `apps/admin/src/app/(private)/financial-partners/[id]/edit/page.tsx`

- [ ] **Step 1: Criar `page.tsx` (listagem)**

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FinancialPartnerTable } from './_components/financial-partner-table'
import { listFinancialPartners } from './queries'

export const metadata = {
  title: 'Instituições Financeiras',
}

export default async function FinancialPartnersPage() {
  const partners = await listFinancialPartners()

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          Instituições Financeiras
        </h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/financial-partners/new">Cadastrar Instituição</Link>
          </Button>
        </div>
      </div>
      <FinancialPartnerTable partners={partners} />
    </div>
  )
}
```

- [ ] **Step 2: Criar `new/page.tsx`**

```typescript
import { FinancialPartnerForm } from '../_components/financial-partner-form'
import { getCurrentUserRole } from '../queries'

export const metadata = {
  title: 'Cadastrar Instituição Financeira',
}

export default async function NewFinancialPartnerPage() {
  const role = await getCurrentUserRole()
  const isSuperAdmin = role === 'super_admin'

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Cadastrar Instituição Financeira
          </h2>
          <p className="text-muted-foreground mt-2">
            Adicione uma nova instituição financeira parceira da Vello.
          </p>
        </div>
      </div>
      <div className="pt-4">
        <FinancialPartnerForm isSuperAdmin={isSuperAdmin} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Criar `[id]/edit/page.tsx`**

```typescript
import { notFound } from 'next/navigation'
import { FinancialPartnerForm } from '../../_components/financial-partner-form'
import { getCurrentUserRole, getFinancialPartner } from '../../queries'

export const metadata = {
  title: 'Editar Instituição Financeira',
}

export default async function EditFinancialPartnerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [partner, role] = await Promise.all([
    getFinancialPartner(id).catch(() => null),
    getCurrentUserRole(),
  ])

  if (!partner) notFound()

  const isSuperAdmin = role === 'super_admin'

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Editar Instituição Financeira
          </h2>
          <p className="text-muted-foreground mt-2">{partner.name}</p>
        </div>
      </div>
      <div className="pt-4">
        <FinancialPartnerForm partner={partner} isSuperAdmin={isSuperAdmin} />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verificar compilação**

```bash
cd /Users/gilbertobueno/Projects/vello/vello-finance/apps/admin
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Resultado esperado: apenas os erros pré-existentes de `@vello/database`.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/\(private\)/financial-partners/page.tsx \
        apps/admin/src/app/\(private\)/financial-partners/new/page.tsx \
        apps/admin/src/app/\(private\)/financial-partners/\[id\]/edit/page.tsx
git commit -m "feat(admin): adiciona páginas de listagem, criação e edição de IFs"
```

---

## Task 6: Renomear label no sidebar

**Files:**
- Modify: `apps/admin/src/components/sidebar/nav-main.tsx`

- [ ] **Step 1: Alterar o label**

No arquivo `apps/admin/src/components/sidebar/nav-main.tsx`, localizar:

```typescript
            <SidebarMenuItem key="financial-partners">
              <NavLink
                href="/financial-partners"
                icon={<Landmark />}
                label="Parceiros Bancários"
              />
            </SidebarMenuItem>
```

Substituir por:

```typescript
            <SidebarMenuItem key="financial-partners">
              <NavLink
                href="/financial-partners"
                icon={<Landmark />}
                label="Instituições Financeiras"
              />
            </SidebarMenuItem>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/components/sidebar/nav-main.tsx
git commit -m "feat(admin): renomeia 'Parceiros Bancários' para 'Instituições Financeiras' no sidebar"
```

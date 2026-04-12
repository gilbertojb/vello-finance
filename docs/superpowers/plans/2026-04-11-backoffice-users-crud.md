# CRUD Backoffice Users — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar CRUD de usuários do backoffice (equipe interna) no Vello Admin, com permissões CASL e proteção anti-self.

**Architecture:** Server Actions + Server Components seguindo padrão fat-server existente. CASL conditions para anti-self em delete/deactivate. RLS atualizado para permitir escrita por `admin` além de `super_admin`.

**Tech Stack:** Next.js 16 (App Router), Supabase Auth Admin API, CASL, Zod, shadcn/ui, Sonner (toasts)

**Spec:** `docs/features/admin/users/SPEC.md`

---

## File Structure

### New files

```
apps/admin/src/app/(private)/users/
├── page.tsx              ← listagem (Server Component)
├── new/page.tsx          ← criação (Server Component)
├── [id]/edit/page.tsx    ← edição (Server Component)
├── queries.ts            ← queries reutilizáveis
├── actions.ts            ← server actions (create, update, delete)
└── _components/
    ├── user-table.tsx    ← tabela com badges + ações (Client Component)
    └── user-form.tsx     ← formulário compartilhado create/edit (Client Component)

supabase/migrations/
└── 20260411000000_update_backoffice_users_rls.sql
```

### Modified files

```
packages/auth/src/subjects/user.ts     ← adicionar 'deactivate', aceitar userSchema
packages/auth/src/permissions.ts       ← atualizar admin, super_admin
apps/admin/src/components/sidebar/nav-main.tsx  ← adicionar item "Usuários"
```

---

## Task 1: Atualizar CASL — userSubject + permissions

**Files:**
- Modify: `packages/auth/src/subjects/user.ts`
- Modify: `packages/auth/src/permissions.ts`

- [ ] **Step 1: Atualizar userSubject para aceitar schema e adicionar `deactivate`**

```typescript
// packages/auth/src/subjects/user.ts
import { z } from 'zod'
import { userSchema } from '../models/user'

export const userSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
    z.literal('deactivate'),
  ]),
  z.union([z.literal('User'), userSchema]),
])

export type UserSubject = z.infer<typeof userSubject>
```

- [ ] **Step 2: Atualizar permissions — super_admin e admin**

```typescript
// packages/auth/src/permissions.ts
// Atualizar apenas super_admin e admin, mantendo o restante igual

super_admin(user, { can, cannot }) {
  can('manage', 'all')
  cannot('delete', 'User', { id: { $eq: user.id } })
  cannot('deactivate', 'User', { id: { $eq: user.id } })
},
admin(user, { can, cannot }) {
  can('manage', 'Tenant')
  can('manage', 'Product')
  can('manage', 'FinancialPartner')
  can('manage', 'User')
  cannot('delete', 'User')
  cannot('deactivate', 'User', { id: { $eq: user.id } })
},
```

- [ ] **Step 3: Verificar build do package**

Run: `cd packages/auth && pnpm tsc --noEmit`
Expected: sem erros de tipo

- [ ] **Step 4: Commit**

```bash
git add packages/auth/src/subjects/user.ts packages/auth/src/permissions.ts
git commit -m "feat(packages/auth): add deactivate action and admin user management permissions"
```

---

## Task 2: Migration RLS — permitir escrita por admin

**Files:**
- Create: `supabase/migrations/20260411000000_update_backoffice_users_rls.sql`

- [ ] **Step 1: Criar migration**

```sql
-- supabase/migrations/20260411000000_update_backoffice_users_rls.sql
-- Permitir que 'admin' (além de 'super_admin') gerencie backoffice_users.
-- Restrições de delete (super_admin only) e anti-self são enforced na application layer (CASL).

DROP POLICY "super_admin_write" ON backoffice_users;

CREATE POLICY "admin_write" ON backoffice_users
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin')
  );
```

- [ ] **Step 2: Aplicar migration**

Run: `npx supabase db push`
Expected: migration aplicada sem erros

- [ ] **Step 3: Regenerar types**

Run: `pnpm db:types`
Expected: types atualizados

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260411000000_update_backoffice_users_rls.sql packages/database/src/types.ts
git commit -m "feat(database): allow admin role to write backoffice_users"
```

---

## Task 3: Queries — listUsers e getUser

**Files:**
- Create: `apps/admin/src/app/(private)/users/queries.ts`

- [ ] **Step 1: Criar queries**

```typescript
// apps/admin/src/app/(private)/users/queries.ts
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function listUsers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('backoffice_users')
    .select('id, role, full_name, is_active, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error

  // Buscar emails do auth.users via service client
  const serviceClient = createServiceClient()
  const userIds = data.map((u) => u.id)

  const usersWithEmail = await Promise.all(
    data.map(async (user) => {
      const { data: authData } = await serviceClient.auth.admin.getUserById(user.id)
      return { ...user, email: authData?.user?.email ?? '' }
    }),
  )

  return usersWithEmail
}

export async function getUser(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('backoffice_users')
    .select('id, role, full_name, is_active, created_at')
    .eq('id', id)
    .single()
  if (error) throw error

  const serviceClient = createServiceClient()
  const { data: authData } = await serviceClient.auth.admin.getUserById(id)

  return { ...data, email: authData?.user?.email ?? '' }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/(private)/users/queries.ts
git commit -m "feat(admin): add backoffice users queries"
```

---

## Task 4: Server Actions — createUser, updateUser, deleteUser

**Files:**
- Create: `apps/admin/src/app/(private)/users/actions.ts`

- [ ] **Step 1: Criar actions**

```typescript
// apps/admin/src/app/(private)/users/actions.ts
'use server'

import { defineAbilityFor, userSchema } from '@vello/auth'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { requireBackofficeUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const createUserSchema = z.object({
  email: z.string().email('Email inválido.'),
  full_name: z.string().min(2, 'Mínimo 2 caracteres.').max(100),
  role: z.enum(['super_admin', 'admin', 'financial', 'support']),
  password: z.string().min(8, 'Mínimo 8 caracteres.'),
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2, 'Mínimo 2 caracteres.').max(100),
  role: z.enum(['super_admin', 'admin', 'financial', 'support']),
  is_active: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
  password: z.string().min(8, 'Mínimo 8 caracteres.').optional().or(z.literal('')),
})

export async function createUser(data: FormData) {
  const { user, claims } = await requireBackofficeUser()
  const ability = defineAbilityFor({ id: user.id, user_role: claims.user_role })

  if (!ability.can('create', 'User')) {
    return { success: false, message: 'Sem permissão para criar usuários.', errors: null }
  }

  const obj = Object.fromEntries(data)
  const parsed = createUserSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const serviceClient = createServiceClient()

  const { data: authUser, error: authError } =
    await serviceClient.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
    })

  if (authError) {
    return { success: false, message: authError.message, errors: null }
  }

  const supabase = await createClient()
  const { error: insertError } = await supabase
    .from('backoffice_users')
    .insert({
      id: authUser.user.id,
      role: parsed.data.role,
      full_name: parsed.data.full_name,
    })

  if (insertError) {
    // Rollback: remover usuário criado no auth
    await serviceClient.auth.admin.deleteUser(authUser.user.id)
    return { success: false, message: insertError.message, errors: null }
  }

  revalidatePath('/users')
  return { success: true, message: 'Usuário criado com sucesso!', errors: null }
}

export async function updateUser(data: FormData) {
  const { user, claims } = await requireBackofficeUser()
  const ability = defineAbilityFor({ id: user.id, user_role: claims.user_role })

  if (!ability.can('update', 'User')) {
    return { success: false, message: 'Sem permissão para editar usuários.', errors: null }
  }

  const obj = Object.fromEntries(data)
  const parsed = updateUserSchema.safeParse(obj)
  if (!parsed.success) {
    return {
      success: false,
      message: 'Verifique os erros no formulário.',
      errors: z.flattenError(parsed.error).fieldErrors,
    }
  }

  const { id, password, ...updateData } = parsed.data

  // Verificar anti-self para toggle de is_active
  const supabase = await createClient()
  const { data: current } = await supabase
    .from('backoffice_users')
    .select('id, user_role:role, is_active')
    .eq('id', id)
    .single()

  if (current && current.is_active !== updateData.is_active) {
    const targetUser = userSchema.parse({ id, user_role: current.user_role })
    if (!ability.can('deactivate', targetUser)) {
      return { success: false, message: 'Não é possível alterar seu próprio status.', errors: null }
    }
  }

  const { error: updateError } = await supabase
    .from('backoffice_users')
    .update({
      full_name: updateData.full_name,
      role: updateData.role,
      is_active: updateData.is_active,
    })
    .eq('id', id)

  if (updateError) {
    return { success: false, message: updateError.message, errors: null }
  }

  // Atualizar senha se preenchida
  if (password && password.length >= 8) {
    const serviceClient = createServiceClient()
    const { error: pwError } = await serviceClient.auth.admin.updateUserById(id, { password })
    if (pwError) {
      return { success: false, message: `Dados atualizados, mas erro ao alterar senha: ${pwError.message}`, errors: null }
    }
  }

  revalidatePath('/users')
  revalidatePath(`/users/${id}/edit`)
  return { success: true, message: 'Usuário atualizado com sucesso!', errors: null }
}

export async function deleteUser(id: string) {
  const { user, claims } = await requireBackofficeUser()
  const ability = defineAbilityFor({ id: user.id, user_role: claims.user_role })

  // Buscar target para verificar CASL com condition
  const supabase = await createClient()
  const { data: target } = await supabase
    .from('backoffice_users')
    .select('id, user_role:role')
    .eq('id', id)
    .single()

  if (!target) {
    return { success: false, message: 'Usuário não encontrado.' }
  }

  const targetUser = userSchema.parse({ id: target.id, user_role: target.user_role })
  if (!ability.can('delete', targetUser)) {
    return { success: false, message: 'Sem permissão para excluir este usuário.' }
  }

  const { error: deleteError } = await supabase
    .from('backoffice_users')
    .delete()
    .eq('id', id)

  if (deleteError) {
    return { success: false, message: deleteError.message }
  }

  const serviceClient = createServiceClient()
  await serviceClient.auth.admin.deleteUser(id)

  revalidatePath('/users')
  return { success: true, message: 'Usuário excluído com sucesso!' }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/(private)/users/actions.ts
git commit -m "feat(admin): add backoffice users server actions with CASL permissions"
```

---

## Task 5: Componente UserForm

**Files:**
- Create: `apps/admin/src/app/(private)/users/_components/user-form.tsx`

- [ ] **Step 1: Criar formulário**

```typescript
// apps/admin/src/app/(private)/users/_components/user-form.tsx
'use client'

import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
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
import { Switch } from '@/components/ui/switch'
import { useFormState } from '@/hooks/use-form-state'

import { createUser, updateUser } from '../actions'

export type UserForEdit = {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
}

type Props = {
  user?: UserForEdit
  canDeactivate?: boolean
}

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'financial', label: 'Financeiro' },
  { value: 'support', label: 'Suporte' },
]

export function UserForm({ user, canDeactivate = false }: Props) {
  const router = useRouter()
  const isEdit = !!user

  const action = isEdit ? updateUser : createUser

  const [formState, handleSubmit, isPending] = useFormState(
    action,
    () => {
      toast.success(
        isEdit ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!',
      )
      router.push('/users')
    },
    (msg: string) => {
      toast.error(msg)
    },
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-8 w-full">
      {isEdit && <input type="hidden" name="id" value={user.id} />}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</CardTitle>
          <CardDescription>
            {isEdit
              ? 'Atualize os dados do membro da equipe.'
              : 'Cadastre um novo membro da equipe interna.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field>
              <FieldLabel htmlFor="email">Email *</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="usuario@vellofinance.com.br"
                defaultValue={user?.email ?? ''}
                readOnly={isEdit}
                className={isEdit ? 'bg-muted' : ''}
              />
              <FieldError errors={formState.errors?.email} />
            </Field>

            <Field>
              <FieldLabel htmlFor="full_name">Nome completo *</FieldLabel>
              <Input
                id="full_name"
                name="full_name"
                required
                placeholder="Nome do colaborador"
                defaultValue={user?.full_name ?? ''}
              />
              <FieldError errors={formState.errors?.full_name} />
            </Field>

            <Field>
              <FieldLabel htmlFor="role">Role *</FieldLabel>
              <select
                id="role"
                name="role"
                required
                defaultValue={user?.role ?? 'support'}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FieldError errors={formState.errors?.role} />
            </Field>

            <Field>
              <FieldLabel htmlFor="password">
                {isEdit ? 'Gerar nova senha' : 'Gerar senha *'}
              </FieldLabel>
              <Input
                id="password"
                name="password"
                type="text"
                required={!isEdit}
                placeholder={isEdit ? 'Deixe vazio para manter a atual' : 'Mínimo 8 caracteres'}
                minLength={isEdit ? undefined : 8}
              />
              <FieldError errors={formState.errors?.password} />
            </Field>

            {isEdit && canDeactivate && (
              <Field className="md:col-span-2">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FieldLabel htmlFor="is_active" className="text-base">
                      Usuário ativo
                    </FieldLabel>
                    <p className="text-sm text-muted-foreground">
                      Usuários inativos não conseguem fazer login.
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    name="is_active"
                    defaultChecked={user.is_active}
                  />
                </div>
              </Field>
            )}

            {isEdit && !canDeactivate && (
              <input type="hidden" name="is_active" value={user.is_active ? 'on' : ''} />
            )}
          </FieldGroup>
        </CardContent>
      </Card>

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => router.push('/users')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isEdit ? (
            'Salvar Alterações'
          ) : (
            'Cadastrar Usuário'
          )}
        </Button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/(private)/users/_components/user-form.tsx
git commit -m "feat(admin): add backoffice user form component"
```

---

## Task 6: Componente UserTable

**Files:**
- Create: `apps/admin/src/app/(private)/users/_components/user-table.tsx`

- [ ] **Step 1: Criar tabela**

```typescript
// apps/admin/src/app/(private)/users/_components/user-table.tsx
'use client'

import { MoreHorizontal, Pencil, Power, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { deleteUser, updateUser } from '../actions'

type UserRow = {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
  created_at: string
}

type Permissions = {
  canEdit: boolean
  canDelete: (userId: string) => boolean
  canDeactivate: (userId: string) => boolean
}

const ROLE_LABELS: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: 'Super Admin',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
  },
  admin: {
    label: 'Admin',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  },
  financial: {
    label: 'Financeiro',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  support: {
    label: 'Suporte',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300',
  },
}

function RoleBadge({ role }: { role: string }) {
  const config = ROLE_LABELS[role] ?? { label: role, className: 'bg-gray-100 text-gray-800' }
  return <Badge className={config.className}>{config.label}</Badge>
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300">
      Ativo
    </Badge>
  ) : (
    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-300">
      Inativo
    </Badge>
  )
}

function UserActions({
  user,
  permissions,
}: {
  user: UserRow
  permissions: Permissions
}) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const showDeactivate = permissions.canDeactivate(user.id)
  const showDelete = permissions.canDelete(user.id)

  function handleToggleActive() {
    if (!confirm(user.is_active ? 'Desativar este usuário?' : 'Reativar este usuário?')) return

    const formData = new FormData()
    formData.set('id', user.id)
    formData.set('full_name', user.full_name ?? '')
    formData.set('role', user.role)
    formData.set('is_active', user.is_active ? '' : 'on')
    formData.set('password', '')

    startTransition(async () => {
      const result = await updateUser(formData)
      if (result.success) {
        toast.success(user.is_active ? 'Usuário desativado.' : 'Usuário reativado.')
      } else {
        toast.error(result.message || 'Erro ao atualizar status.')
      }
    })
  }

  function handleDelete() {
    if (!confirm('Excluir este usuário permanentemente? Esta ação não pode ser desfeita.')) return

    startTransition(async () => {
      const result = await deleteUser(user.id)
      if (result.success) {
        toast.success('Usuário excluído.')
      } else {
        toast.error(result.message || 'Erro ao excluir.')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={isPending}>
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Ações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {permissions.canEdit && (
          <DropdownMenuItem asChild>
            <Link href={`/users/${user.id}/edit`}>
              <Pencil className="size-4" />
              Editar
            </Link>
          </DropdownMenuItem>
        )}

        {showDeactivate && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={user.is_active ? 'text-destructive focus:text-destructive' : ''}
              disabled={isPending}
              onClick={handleToggleActive}
            >
              <Power className="size-4" />
              {user.is_active ? 'Desativar' : 'Reativar'}
            </DropdownMenuItem>
          </>
        )}

        {showDelete && (
          <>
            {!showDeactivate && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              disabled={isPending}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function UserTable({
  users,
  permissions,
}: {
  users: ReadonlyArray<UserRow>
  permissions: Permissions
}) {
  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground border border-dashed rounded-lg bg-card">
        <p>Nenhum usuário cadastrado.</p>
        {permissions.canEdit && (
          <Button variant="link" asChild className="mt-2">
            <Link href="/users/new">Cadastrar o primeiro usuário</Link>
          </Button>
        )}
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
              Email
            </th>
            <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
              Role
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
          {users.map((user) => (
            <tr
              key={user.id}
              className="border-b transition-colors hover:bg-muted/50"
            >
              <td className="p-4 align-middle font-medium">
                {user.full_name || '—'}
              </td>
              <td className="p-4 align-middle text-muted-foreground text-xs">
                {user.email}
              </td>
              <td className="p-4 align-middle">
                <RoleBadge role={user.role} />
              </td>
              <td className="p-4 align-middle">
                <StatusBadge isActive={user.is_active} />
              </td>
              <td className="p-4 align-middle text-right">
                <UserActions user={user} permissions={permissions} />
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
git add apps/admin/src/app/(private)/users/_components/user-table.tsx
git commit -m "feat(admin): add backoffice users table component with CASL-based actions"
```

---

## Task 7: Páginas — listagem, criação, edição

**Files:**
- Create: `apps/admin/src/app/(private)/users/page.tsx`
- Create: `apps/admin/src/app/(private)/users/new/page.tsx`
- Create: `apps/admin/src/app/(private)/users/[id]/edit/page.tsx`

- [ ] **Step 1: Página de listagem**

```typescript
// apps/admin/src/app/(private)/users/page.tsx
import { defineAbilityFor, userSchema } from '@vello/auth'

import Link from 'next/link'

import { requireBackofficeUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'

import { UserTable } from './_components/user-table'
import { listUsers } from './queries'

export const metadata = {
  title: 'Usuários',
}

export default async function UsersPage() {
  const { user, claims } = await requireBackofficeUser()
  const ability = defineAbilityFor({ id: user.id, user_role: claims.user_role })

  const users = await listUsers()

  const canCreate = ability.can('create', 'User')

  const permissions = {
    canEdit: ability.can('update', 'User'),
    canDelete: (targetId: string) => {
      const target = users.find((u) => u.id === targetId)
      if (!target) return false
      const targetUser = userSchema.parse({ id: target.id, user_role: target.role })
      return ability.can('delete', targetUser)
    },
    canDeactivate: (targetId: string) => {
      const target = users.find((u) => u.id === targetId)
      if (!target) return false
      const targetUser = userSchema.parse({ id: target.id, user_role: target.role })
      return ability.can('deactivate', targetUser)
    },
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Usuários</h2>
        {canCreate && (
          <Button asChild>
            <Link href="/users/new">Novo Usuário</Link>
          </Button>
        )}
      </div>
      <UserTable users={users} permissions={permissions} />
    </div>
  )
}
```

- [ ] **Step 2: Página de criação**

```typescript
// apps/admin/src/app/(private)/users/new/page.tsx
import { defineAbilityFor } from '@vello/auth'
import { redirect } from 'next/navigation'

import { requireBackofficeUser } from '@/lib/auth'

import { UserForm } from '../_components/user-form'

export const metadata = {
  title: 'Novo Usuário',
}

export default async function NewUserPage() {
  const { user, claims } = await requireBackofficeUser()
  const ability = defineAbilityFor({ id: user.id, user_role: claims.user_role })

  if (!ability.can('create', 'User')) {
    redirect('/users')
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Novo Usuário</h2>
      <UserForm />
    </div>
  )
}
```

- [ ] **Step 3: Página de edição**

```typescript
// apps/admin/src/app/(private)/users/[id]/edit/page.tsx
import { defineAbilityFor, userSchema } from '@vello/auth'
import { notFound, redirect } from 'next/navigation'

import { requireBackofficeUser } from '@/lib/auth'

import { UserForm } from '../../_components/user-form'
import { getUser } from '../../queries'

export const metadata = {
  title: 'Editar Usuário',
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { user: currentUser, claims } = await requireBackofficeUser()
  const ability = defineAbilityFor({ id: currentUser.id, user_role: claims.user_role })

  if (!ability.can('update', 'User')) {
    redirect('/users')
  }

  const user = await getUser(id)
  if (!user) notFound()

  const targetUser = userSchema.parse({ id: user.id, user_role: user.role })
  const canDeactivate = ability.can('deactivate', targetUser)

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Editar Usuário</h2>
      <UserForm user={user} canDeactivate={canDeactivate} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/(private)/users/page.tsx apps/admin/src/app/(private)/users/new/page.tsx apps/admin/src/app/(private)/users/\[id\]/edit/page.tsx
git commit -m "feat(admin): add backoffice users list, create, and edit pages"
```

---

## Task 8: Sidebar — adicionar item Usuários

**Files:**
- Modify: `apps/admin/src/components/sidebar/nav-main.tsx`

- [ ] **Step 1: Adicionar item "Usuários" ao grupo Cadastros**

Adicionar import `Users` do lucide-react e novo `SidebarMenuItem` após "Instituições Financeiras":

```tsx
// Adicionar ao import de ícones:
import { Users } from 'lucide-react'

// Adicionar após o SidebarMenuItem de financial-partners:
<SidebarMenuItem key="users">
  <NavLink href="/users" icon={<Users />} label="Usuários" />
</SidebarMenuItem>
```

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/components/sidebar/nav-main.tsx
git commit -m "feat(admin): add users menu item to sidebar"
```

---

## Task 9: Verificação manual

- [ ] **Step 1: Iniciar dev server**

Run: `cd apps/admin && pnpm dev`

- [ ] **Step 2: Testar listagem**

Navegar para `http://localhost:3000/users`. Verificar que a tabela exibe os usuários com badges de role e status.

- [ ] **Step 3: Testar criação**

Clicar "Novo Usuário", preencher formulário, submeter. Verificar que o usuário aparece na listagem.

- [ ] **Step 4: Testar edição**

Clicar "Editar" em um usuário. Alterar nome e role. Verificar que o campo "Gerar nova senha" está opcional. Verificar que o toggle "Ativo" não aparece para o próprio usuário.

- [ ] **Step 5: Testar proteção anti-self**

Verificar que na listagem, o dropdown do próprio usuário não mostra opções de Desativar/Excluir.

- [ ] **Step 6: Testar exclusão (super_admin)**

Como super_admin, clicar "Excluir" em outro usuário. Confirmar no modal. Verificar que o usuário desapareceu da lista.

- [ ] **Step 7: Commit final**

```bash
git add -A
git commit -m "chore(admin): verify backoffice users CRUD"
```

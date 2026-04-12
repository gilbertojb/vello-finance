# Feature Spec — Gestão de Usuários do Backoffice

**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Usuários
**Terminologia UI:** "Usuários" (banco de dados permanece `backoffice_users`)
**Status:** `pending`
**Prioridade:** Alta

## Status de Implementação

| Feature | Status | Notas |
|---|---|---|
| F1 — Listagem | ⏳ Pendente | — |
| F2 — Cadastro | ⏳ Pendente | — |
| F3 — Edição | ⏳ Pendente | — |
| F4 — Desativar/Ativar | ⏳ Pendente | — |
| F5 — Excluir | ⏳ Pendente | — |

## Decisões Técnicas

- Email vem de `auth.users.email` (join) — não duplicado em `backoffice_users`
- Senha definida pelo admin no cadastro (sem email de boas-vindas)
- Na edição, campo "Gerar nova senha" é opcional — só atualiza se preenchido
- Proteção anti-self (desativar/excluir) via CASL conditions, não RLS
- Delete exclusivo de `super_admin` via CASL — RLS permite escrita para ambos (`super_admin`, `admin`)
- Ação `deactivate` adicionada ao CASL `userSubject` para granularidade de permissão

---

## Modelo de Dados

### Tabela `backoffice_users` (existente)

```sql
CREATE TYPE backoffice_role AS ENUM ('super_admin', 'admin', 'financial', 'support');

CREATE TABLE backoffice_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       backoffice_role NOT NULL DEFAULT 'support',
  full_name  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### RLS atual

```sql
-- Todos os roles do backoffice podem ler
CREATE POLICY "backoffice_full_read" ON backoffice_users
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

-- Apenas super_admin pode escrever (SERÁ ATUALIZADO)
CREATE POLICY "super_admin_write" ON backoffice_users
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = 'super_admin'
  ) WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'super_admin'
  );
```

### RLS — nova migration

Ajustar policy de escrita para incluir `admin`:

```sql
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

A restrição de delete exclusivo para `super_admin` e a proteção anti-self são enforced na application layer (Server Actions + CASL), não no RLS.

---

## Permissões

### Matriz de permissões

| Ação | super_admin | admin | financial / support |
|---|---|---|---|
| Listar | sim | sim | sim |
| Criar | sim | sim | — |
| Editar | sim | sim | — |
| Desativar/ativar | sim | sim | — |
| Excluir permanentemente | sim | — | — |
| Auto-desativar | — | — | — |
| Auto-excluir | — | — | — |

### CASL (`packages/auth`)

Adicionar `deactivate` ao `userSubject`:

```typescript
// subjects/user.ts
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
```

Atualizar permissões:

```typescript
// permissions.ts
super_admin(user, { can, cannot }) {
  can('manage', 'all')
  cannot('delete', 'User', { id: { $eq: user.id }})
  cannot('deactivate', 'User', { id: { $eq: user.id }})
},
admin(user, { can, cannot }) {
  can('manage', 'User')
  cannot('delete', 'User')
  cannot('deactivate', 'User', { id: { $eq: user.id }})
},
financial(_user, { can }) {
  // ... permissões existentes ...
  can('get', 'User')
},
support(_user, { can }) {
  // ... permissões existentes ...
  can('get', 'User')
},
```

Verificação nas actions e na UI:

```typescript
import { userSchema } from '@vello/auth'

// Parseia o registro do banco — injeta __typename: 'User' via .default()
const targetUser = userSchema.parse(backofficeUser)

// Permissão por role (sem condition) — passa string
ability.can('create', 'User')

// Permissão com condition anti-self — passa objeto parseado
ability.can('delete', targetUser)      // false se self (super_admin) ou sempre (admin)
ability.can('deactivate', targetUser)  // false se self
```

---

## Funcionalidades

### F1 — Listagem · `src/app/(private)/users/page.tsx`

**Colunas da tabela:** Nome · Email · Role · Status · Ações

**Ações por linha (visíveis conforme permissão CASL):**
- Editar (`can('update', target)`)
- Desativar/Ativar (`can('deactivate', target)` — escondido para self)
- Excluir (`can('delete', target)` — super_admin apenas, escondido para self)

**Critérios de Aceite:**
- [ ] Badge de role com cores semânticas
- [ ] Badge de status: Ativo (verde) / Inativo (cinza)
- [ ] Botão "Novo usuário" no header (visível se `can('create', 'User')`)
- [ ] Modal de confirmação para desativar e excluir

---

### F2 — Cadastro · `src/app/(private)/users/new/page.tsx`

Formulário simples (sem steps/abas):

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| Email | input text | Sim | Formato email |
| Nome completo | input text | Sim | 2–100 chars |
| Role | select | Sim | super_admin, admin, financial, support |
| Gerar senha | input text | Sim | Mínimo 8 caracteres |

**Fluxo (Server Action com `createServiceClient()`):**

```typescript
// 1. Cria usuário no Supabase Auth
const { data: authUser } = await serviceClient.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
})

// 2. Insere em backoffice_users
await supabase.from('backoffice_users').insert({
  id: authUser.user.id,
  role,
  full_name,
})
```

**Critérios de Aceite:**
- [ ] Erro se email já existir (Supabase Auth retorna erro)
- [ ] Redirect para `/users` após sucesso com toast
- [ ] Apenas `super_admin` e `admin` acessam esta página

---

### F3 — Edição · `src/app/(private)/users/[id]/edit/page.tsx`

| Campo | Tipo | Obrigatório | Detalhe |
|---|---|---|---|
| Email | input text | — | Readonly (não editável) |
| Nome completo | input text | Sim | 2–100 chars |
| Role | select | Sim | super_admin, admin, financial, support |
| Ativo | toggle switch | Sim | Visível conforme permissão |
| Gerar nova senha | input text | Não | Se preenchido, atualiza senha |

**Fluxo:**

```typescript
// 1. Update em backoffice_users
await supabase.from('backoffice_users')
  .update({ full_name, role, is_active })
  .eq('id', targetId)

// 2. Se senha preenchida:
await serviceClient.auth.admin.updateUserById(targetId, { password })
```

**Critérios de Aceite:**
- [ ] Email exibido mas não editável
- [ ] Label do campo de senha: "Gerar nova senha" (diferente do create)
- [ ] Toggle de ativo escondido para o próprio usuário (anti-self via CASL)
- [ ] Toast de sucesso após salvar

---

### F4 — Desativar / Ativar

**Gatilho:** Botão na tabela (F1) ou toggle na edição (F3)

**Proteção anti-self:** `ability.can('deactivate', target)` retorna `false` quando `target.id === currentUser.id`

**Critérios de Aceite:**
- [ ] Modal de confirmação antes de desativar
- [ ] Usuário desativado não consegue fazer login (auth hook verifica `is_active`)
- [ ] Botão escondido na linha do próprio usuário

---

### F5 — Excluir Permanentemente

**Gatilho:** Botão na tabela (F1), visível apenas para `super_admin`

**Fluxo:**

```typescript
// 1. Delete de backoffice_users
await supabase.from('backoffice_users').delete().eq('id', targetId)

// 2. Delete do Supabase Auth
await serviceClient.auth.admin.deleteUser(targetId)
```

**Critérios de Aceite:**
- [ ] Modal de confirmação antes de excluir
- [ ] Botão visível apenas para `super_admin` e escondido para self
- [ ] Redirect para `/users` se excluiu da página de edição

---

## Validação (Zod)

```typescript
const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2).max(100),
  role: z.enum(['super_admin', 'admin', 'financial', 'support']),
  password: z.string().min(8),
})

const updateUserSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().min(2).max(100),
  role: z.enum(['super_admin', 'admin', 'financial', 'support']),
  is_active: z.preprocess((v) => v === 'on' || v === true, z.boolean()),
  password: z.string().min(8).optional().or(z.literal('')),
})
```

---

## Sidebar

Adicionar item "Usuários" com ícone `Users` (lucide-react) no menu lateral.

---

## Arquivos a Criar

```
apps/admin/src/app/(private)/users/
├── page.tsx              ← listagem (Server Component)
├── new/page.tsx          ← criação
├── [id]/edit/page.tsx    ← edição
├── queries.ts            ← queries reutilizáveis
├── actions.ts            ← server actions
└── _components/
    ├── user-table.tsx    ← tabela com badges + ações
    └── user-form.tsx     ← formulário compartilhado (create/edit)

supabase/migrations/
└── YYYYMMDD_update_backoffice_users_rls.sql  ← nova policy
```

---

## Fora do Escopo desta Feature

- Perfil do próprio usuário (será feito via `profile-button.tsx`)
- Upload de avatar
- Histórico de ações / audit log
- Autenticação MFA
- Gestão de `tenant_users` pelo admin (feature separada)

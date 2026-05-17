# Sales Team — Spec de Design
**Data:** 2026-05-16
**Escopo:** `apps/console`, `apps/store`, `packages/auth`, `supabase/migrations`, `packages/email`

---

## Visão Geral

Feature de Time de Vendas vinculado ao tenant no console. O `tenant_admin` convida vendedores via email. Após aceitar o convite e criar sua senha, o vendedor acessa o console com painel restrito — filtrado pelo próprio `seller_id`. Simulações originadas pelo link do vendedor na store ficam atribuídas a ele. Acesso pode ser revogado a qualquer momento pelo admin.

**Fora de escopo nesta fase:** gestão de propostas por vendedor, pagamento de comissões, relatórios financeiros de vendedores.

---

## 1. Modelo de Dados

### 1.1 Novo role: `tenant_seller`

Adicionado ao ENUM `tenant_role` no PostgreSQL. Espelhado em `packages/auth`.

```sql
ALTER TYPE tenant_role ADD VALUE 'tenant_seller';
```

### 1.2 Tabela `seller_invites`

```sql
CREATE TABLE seller_invites (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  invited_by  UUID NOT NULL REFERENCES tenant_users(id),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'revoked')),
  invited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ
);

-- Índice parcial: impede dois convites ativos para o mesmo email,
-- mas permite re-convidar após revogação (status = 'revoked').
CREATE UNIQUE INDEX seller_invites_active_email_idx
  ON seller_invites(email)
  WHERE status IN ('pending', 'accepted');

ALTER TABLE seller_invites ENABLE ROW LEVEL SECURITY;

-- Backoffice: acesso total
CREATE POLICY "backoffice_full_access" ON seller_invites
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Tenant admin: gerencia convites do próprio tenant
CREATE POLICY "tenant_admin_manage" ON seller_invites
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') = 'tenant_admin'
  );
```

O índice parcial garante que o mesmo email não pode ter dois convites ativos (`pending` ou `accepted`) simultaneamente — mas permite re-convidar após revogação. A validação de email já existente em `tenant_users` é feita na Server Action antes de inserir.

### 1.3 Coluna `seller_id` em `simulations`

```sql
ALTER TABLE simulations
  ADD COLUMN seller_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL;
```

`NULL` = simulação direta sem vendedor (exibida como "ZP Pay" na UI).

### 1.4 Coluna `seller_commission_pct` em `tenant_products`

```sql
ALTER TABLE tenant_products
  ADD COLUMN seller_commission_pct NUMERIC(6,3) NOT NULL DEFAULT 0;
```

Configurada pelo `tenant_admin` por produto. Representa a fração do `tenant_commission_pct` repassada ao vendedor. A aplicação valida que `seller_commission_pct <= tenant_commission_pct`.

### 1.5 RLS em `simulations` (ajuste)

Adicionar policy para `tenant_seller` acessar apenas as próprias simulações:

```sql
CREATE POLICY "seller_own_simulations" ON simulations
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = 'tenant_seller'
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND seller_id = (auth.jwt() ->> 'sub')::uuid
  );
```

---

## 2. RBAC — `packages/auth`

### 2.1 Role schema

```typescript
// packages/auth/src/roles/role.ts
export const roleSchema = z.union([
  z.literal('super_admin'),
  z.literal('admin'),
  z.literal('financial'),
  z.literal('support'),
  z.literal('tenant_admin'),
  z.literal('tenant_operator'),
  z.literal('tenant_seller'),   // novo
])
```

### 2.2 Novos subjects

```typescript
// packages/auth/src/subjects/simulation.ts
export const simulationSubject = z.tuple([
  z.union([z.literal('get'), z.literal('manage')]),
  z.union([
    z.literal('Simulation'),
    z.object({ __typename: z.literal('Simulation'), seller_id: z.string().uuid().nullable() }),
  ]),
])

// packages/auth/src/subjects/seller-invite.ts
export const sellerInviteSubject = z.tuple([
  z.union([z.literal('manage'), z.literal('get')]),
  z.literal('SellerInvite'),
])
```

Ambos exportados e registrados no `appAbilitiesSchema` em `index.ts`.

### 2.3 Permissões por role

```typescript
// packages/auth/src/permissions.ts

tenant_admin(_user, { can }) {
  can('get', 'Product')
  can('get', 'FinancialPartner')
  can('get', 'Tenant')
  can('manage', 'Simulation')       // todas as simulações do tenant
  can('manage', 'SellerInvite')     // convida, lista, revoga
},

tenant_operator(_user, { can }) {
  can('get', 'Product')
  can('get', 'FinancialPartner')
  can('get', 'Tenant')
  can('get', 'Simulation')          // leitura de todas — sem escrita
},

tenant_seller(user, { can, cannot }) {
  can('get', 'Product')             // produtos em modo leitura
  can('get', 'Simulation', {        // apenas as próprias simulações
    seller_id: { $eq: user.id },
  })
  cannot('manage', 'SellerInvite')
  cannot('manage', 'Simulation')
},
```

### 2.4 Novo helper

```typescript
// packages/auth/src/roles/helpers.ts
export function isSellerRole(role: Role): boolean {
  return role === 'tenant_seller'
}
```

---

## 3. Fluxo de Convite

### 3.1 Criação (console — `tenant_admin`)

1. Admin acessa `/sales-team` → clica em "Convidar Vendedor"
2. Preenche nome e email no `InviteSheet`
3. Server Action `inviteSeller`:
   - Valida que o email não existe em `tenant_users`
   - Valida que não há `seller_invites` com status `pending` ou `accepted` para o email
   - Chama `supabase.auth.admin.inviteUserByEmail(email, { redirectTo, data: { tenant_id, role: 'tenant_seller', full_name } })`
   - `redirectTo` = `https://[slug].vellofinance.com.br/accept-invite`
   - Insere registro em `seller_invites` com status `pending`

### 3.2 Aceitação (rota pública `/accept-invite`)

1. Supabase redireciona para `[slug].vellofinance.com.br/accept-invite?code=xxx`
2. `page.tsx` (Server Component) chama `supabase.auth.exchangeCodeForSession(code)`
3. Valida que `seller_invites` para o email tem status `pending` e `expires_at > now()`
4. Se inválido → exibe erro, não cria usuário
5. Se válido → renderiza `AcceptInviteForm` com formulário de criação de senha
6. Server Action `finalizeSellerOnboarding`:
   - `supabase.auth.updateUser({ password })`
   - Cria registro em `tenant_users` com `role = 'tenant_seller'`, `is_active = true`
   - Atualiza `seller_invites.status = 'accepted'`, `accepted_at = now()`
   - Redireciona para `/` (dashboard do vendedor)

### 3.3 Revogação de acesso ativo

- Admin clica em "Revogar acesso" na listagem de `/sales-team`
- Server Action `revokeSellerAccess`:
  - `tenant_users.is_active = false`
  - `seller_invites.status = 'revoked'`
- O proxy do console bloqueia acesso de usuários com `is_active = false`

### 3.4 Cancelamento de convite pendente

- Admin cancela convite ainda não aceito
- Server Action `revokeInvite`:
  - `seller_invites.status = 'revoked'`
- Se o link do email for clicado após revogação → `finalizeSellerOnboarding` detecta status `revoked` e exibe erro sem criar o usuário

---

## 4. Atribuição do Vendedor na Store

### 4.1 Captura via `proxy.ts` da store

```typescript
// apps/store/src/proxy.ts
if (searchParams.has('v')) {
  const sellerId = searchParams.get('v') ?? ''
  response.cookies.set('vello-seller-ref', sellerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 dias
  })
}
```

- Cookie gravado **exclusivamente no servidor** (proxy) — nenhum JS client-side toca nesse valor
- `?v=` presente → sobrescreve cookie existente
- `?v=` ausente → cookie existente é mantido
- `HttpOnly` impede leitura/escrita por JS (proteção XSS)
- `Secure` garante transmissão apenas via HTTPS em produção
- `SameSite=Lax` bloqueia envio cross-site

### 4.2 Validação na criação da simulação

Server Action `createSimulation` (store):

1. Lê `vello-seller-ref` via `cookies()` — valor tratado como não-confiável
2. Valida que o UUID existe em `tenant_users`
3. Valida `role = 'tenant_seller'`
4. Valida `is_active = true`
5. Valida `tenant_id` do seller = `tenant_id` da simulação atual (proteção cross-tenant)
6. Todas as 5 condições verdadeiras → `seller_id` gravado
7. Qualquer falha → `seller_id = NULL` (silencioso, sem expor erro ao cliente)

### 4.3 Simulações sem vendedor

`seller_id = NULL` → atribuídas ao tenant, exibidas como **"ZP Pay"** na listagem do console.

---

## 5. Painel do Vendedor no Console

### 5.1 Navegação disponível para `tenant_seller`

| Rota | Descrição |
|---|---|
| `/` (dashboard) | KPIs filtrados pelas próprias simulações |
| `/simulations` | Simulações atribuídas ao `seller_id` do usuário |
| `/products` | Produtos disponíveis — somente leitura |

### 5.2 Rotas bloqueadas para `tenant_seller`

O proxy redireciona para `/` qualquer tentativa de acesso a:
`/sales-team`, `/usuarios`, `/store-settings`, `/proposals`

### 5.3 Produtos — modo leitura

O `page.tsx` de produtos passa `readonly={isSellerRole(role)}` para os componentes filhos. Ações ocultadas no modo leitura:
- Ativar/desativar produto
- Popular/não popular
- Upload de capa

A decisão acontece no Server Component — nenhum `if (isSeller)` nos client components.

### 5.4 Simulações — coluna Vendedor (visão admin)

Na listagem de `/simulations` para `tenant_admin` e `tenant_operator`, exibe coluna **Vendedor**:
- Nome do seller quando `seller_id != NULL`
- Badge "ZP Pay" quando `seller_id = NULL`

### 5.5 Filtragem de dados nas queries

```typescript
// apps/console/src/app/(private)/simulations/queries.ts
export async function listSimulations(sellerId?: string) {
  let query = supabase.from('simulations').select(...)
  if (sellerId) query = query.eq('seller_id', sellerId)
  // ...
}
```

O Server Component detecta o role do usuário autenticado e passa `sellerId` quando necessário. O client component nunca decide o filtro.

---

## 6. Estrutura de Módulos

### 6.1 Console — `/sales-team`

```
apps/console/src/app/(private)/sales-team/
├── page.tsx                    ← lista vendedores ativos + convites pendentes
├── actions.ts                  ← inviteSeller, revokeInvite, revokeSellerAccess
├── queries.ts                  ← listSellers, listPendingInvites
└── _components/
    ├── sellers-list.tsx        ← tabela com status e ações
    ├── invite-sheet.tsx        ← sheet lateral com form de convite
    └── seller-status-badge.tsx ← badge: Ativo / Convidado / Revogado
```

### 6.2 Console — `/accept-invite` (público)

```
apps/console/src/app/(public)/accept-invite/
├── page.tsx                    ← troca code, valida invite, renderiza form
├── accept-invite-form.tsx      ← form de senha ('use client')
└── actions.ts                  ← finalizeSellerOnboarding
```

### 6.3 Ajustes em módulos existentes do console

| Arquivo | Mudança |
|---|---|
| `simulations/queries.ts` | `listSimulations(sellerId?)` — filtra por seller quando presente |
| `simulations/page.tsx` | Detecta role, passa `sellerId` para a query e `showSellerColumn` para a lista |
| `products/page.tsx` | Passa `readonly` baseado em `isSellerRole(role)` |
| `sidebar/nav-main.tsx` | Items condicionais por ability (`can('manage', 'SellerInvite')`) |
| `proxy.ts` | Bloqueia rotas restritas para `tenant_seller` |

### 6.4 Store — ajuste no `proxy.ts`

Lógica de captura e gravação do cookie `vello-seller-ref` (ver Seção 4.1).

### 6.5 Email — `packages/email`

Novo template `packages/email/src/templates/console/seller-invite.tsx`:
- Layout `tenant-layout` (branding dinâmico do tenant)
- Conteúdo: nome do convidado, nome do tenant, CTA "Criar minha senha", aviso de validade (7 dias)

---

## 7. Próximas Etapas (fora desta fase)

- Atribuição de `seller_id` em propostas
- Painel financeiro do vendedor (comissões calculadas)
- Configuração de `seller_commission_pct` por produto na UI
- Relatórios de performance por vendedor no painel do `tenant_admin`

# Console Custom Domain

**Data:** 2026-06-16
**Status:** Aprovado

## Contexto

A store já suporta domínio personalizado via `tenants.custom_domain`. O console acessava tenants apenas por subdomínio (`slug.CONSOLE_BASE_DOMAIN`). Esta spec adiciona suporte a `console_custom_domain` no console, seguindo o mesmo padrão.

## Escopo

- Nova coluna `console_custom_domain` na tabela `tenants`
- Correção do `resolve-tenant.ts` do console (atualmente aponta para `custom_domain`, que é da store)
- Campo no admin dentro do card "Configurações da Loja"
- Correção de bug no admin onde `custom_domain` era usado como URL do console

## Fora do escopo

- Testes unitários
- Alterações na store
- Configuração de DNS / Vercel domain registration (feita manualmente)

---

## 1. Banco de dados

### Migration

```sql
ALTER TABLE tenants ADD COLUMN console_custom_domain TEXT UNIQUE;
```

Campo opcional (`NULL` por padrão). A constraint `UNIQUE` impede dois tenants de registrar o mesmo domínio.

**Arquivo:** `supabase/migrations/YYYYMMDDHHMMSS_add_console_custom_domain.sql`

---

## 2. Console — `resolve-tenant.ts`

**Arquivo:** `apps/console/src/lib/tenant/resolve-tenant.ts`

Alterar o filtro usado quando o host não termina em `.CONSOLE_BASE_DOMAIN`:

```ts
// Antes (errado — aponta para o campo da store)
filter = `custom_domain=eq.${host}`

// Depois (correto)
filter = `console_custom_domain=eq.${host}`
```

Nenhuma outra alteração na função.

---

## 3. Admin — campo no card "Configurações da Loja"

### 3a. Schema Zod

**Arquivo:** `apps/admin/src/app/(private)/tenants/tenant-schema.ts`

Adicionar:
```ts
console_custom_domain: z.string().optional().nullable(),
```

### 3b. Tipos do formulário

**Arquivo:** `apps/admin/src/app/(private)/tenants/_components/tenant-form-types.ts`

Adicionar ao tipo `TenantFormData`:
```ts
console_custom_domain: string | null
```

### 3c. Componente `TenantStoreCard`

**Arquivo:** `apps/admin/src/app/(private)/tenants/_components/tenant-store-card.tsx`

Adicionar prop `defaultConsoleCustomDomain: string` e renderizar novo `<Field>` abaixo do grid existente:

```
[ slug               ] [ custom_domain (store)      ]
[ console_custom_domain                              ]
```

Placeholder sugerido: `painel.empresa.com.br`

### 3d. `tenant-form.tsx`

Passar `defaultConsoleCustomDomain={tenant?.console_custom_domain ?? ''}` para `<TenantStoreCard>`.

---

## 4. Fix de bug no admin

Em dois arquivos, `custom_domain` era incorretamente usado como URL do console. Corrigir para `console_custom_domain`:

**`apps/admin/src/app/(private)/tenants/create-tenant.ts`**
```ts
// Antes
tenantData.custom_domain ?? `${tenantData.slug}.${env.CONSOLE_BASE_DOMAIN}`

// Depois
tenantData.console_custom_domain ?? `${tenantData.slug}.${env.CONSOLE_BASE_DOMAIN}`
```

**`apps/admin/src/app/(private)/tenants/tenant-status-actions.ts`**
```ts
// Antes
tenant.custom_domain ?? `${tenant.slug}.${env.CONSOLE_BASE_DOMAIN}`

// Depois
tenant.console_custom_domain ?? `${tenant.slug}.${env.CONSOLE_BASE_DOMAIN}`
```

Ambos constroem a URL do console para e-mails transacionais.

**`apps/admin/src/app/(private)/tenants/[id]/edit/page.tsx`**

A linha que exibe a URL do console também usa `custom_domain`:
```ts
// Antes
{tenant.custom_domain || `${tenant.slug}.vellofinance.com.br`}

// Depois
{tenant.console_custom_domain || `${tenant.slug}.${CONSOLE_BASE_DOMAIN}`}
```

---

## Fluxo de resolução (após a mudança)

```
request → proxy.ts → resolveTenant(host)
  host termina em .CONSOLE_BASE_DOMAIN?
    sim → filtra por slug
    não → filtra por console_custom_domain
  tenant encontrado e ativo?
    não → 404 / 503
    sim → updateSession → resposta normal
```

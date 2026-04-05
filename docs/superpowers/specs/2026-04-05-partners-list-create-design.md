# Design — Parceiros: Listagem e Cadastro

**Data:** 2026-04-05
**App:** `apps/admin`
**Scope:** F1 (Listagem) + F2 (Cadastro)
**Terminologia:** "Parceiros" no UI, `tenants` no banco de dados
**Baseado em:** `docs/features/admin/tenants/SPEC.md`

---

## Decisões de Design

| Decisão | Escolha |
|---|---|
| Formulário | Cards (não wizard) — padrão do sistema |
| Tipo padrão | `whitelabel` hardcoded na action (sem campo no form) |
| Plano | Sem `plan_id` por agora — requer migration |
| Status ao criar | `pending` |
| Slug | Auto-gerado do nome fantasia, editável |
| `custom_domain` | Sempre visível (todos são white-label) |
| Dados bancários | Incluídos no form, todos opcionais |
| Upload de logo/favicon/bg | Fora do escopo desta iteração — campos de URL texto |

---

## Migration Necessária

`plan_id` é `NOT NULL` na tabela `tenants`. Como não vamos associar planos no cadastro, é necessária uma migration para torná-lo nullable:

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_make_plan_id_nullable.sql
ALTER TABLE tenants ALTER COLUMN plan_id DROP NOT NULL;
```

---

## Arquivos

| Arquivo | Tipo |
|---|---|
| `tenants/page.tsx` | Adaptar (era placeholder) |
| `tenants/new/page.tsx` | Novo |
| `tenants/actions.ts` | Novo |
| `tenants/queries.ts` | Novo |
| `tenants/_components/tenant-table.tsx` | Novo |
| `tenants/_components/tenant-form.tsx` | Novo |
| `tenants/_components/tenant-type-badge.tsx` | Novo |
| `tenants/_components/tenant-status-badge.tsx` | Novo |
| `supabase/migrations/..._make_plan_id_nullable.sql` | Novo |

---

## Arquitetura

### Fluxo de dados — Listagem

```
page.tsx (server)
  → listTenants() [queries.ts]
  → <TenantTable tenants={tenants} />
```

### Fluxo de criação

```
new/page.tsx (server) — sem dados necessários
  → <TenantForm />
        → createTenant(FormData) [actions.ts]
              1. Valida campos (Zod)
              2. INSERT tenants (type='whitelabel', status='pending', plan_id=null)
              3. Trigger cria tenant_branding automaticamente
              4. UPDATE tenant_branding SET cores, display_name, etc.
              5. revalidatePath('/tenants')
              6. return { success: true }
```

---

## Formulário — 4 Cards

### Card 1 — Dados da Empresa

| Campo | Name | Obrigatório | Validação |
|---|---|---|---|
| Nome Fantasia | `name` | Sim | 2–100 chars |
| Razão Social | `company_name` | Não | 2–150 chars |
| CNPJ | `cnpj` | Não | texto livre por ora |
| E-mail de Contato | `email` | Sim | email válido |
| Telefone | `phone` | Não | — |

### Card 2 — Configurações da Loja

| Campo | Name | Obrigatório | Detalhe |
|---|---|---|---|
| Slug | `slug` | Sim | Auto-gerado do `name` (lowercase, hífens). Preview: `[slug].vellofinance.com.br` |
| Domínio Customizado | `custom_domain` | Não | Ex: `creditos.empresa.com.br` |

**Slug auto-generation:** `useEffect` observa o campo `name`; ao mudar, transforma em slug com `slugify()` (inline — sem lib externa: `toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')`). O campo slug permanece editável manualmente.

### Card 3 — Identidade Visual

| Campo | Name | Obrigatório | Detalhe |
|---|---|---|---|
| Nome de Exibição | `company_display_name` | Não | Nome nas telas públicas |
| Cor Primária | `primary_color` | Não | Color picker + hex. Default: `#3B5BBE` |
| Cor Secundária | `secondary_color` | Não | Color picker + hex. Default: `#1E3A5F` |
| Cor de Fundo Auth | `auth_bg_color` | Não | Color picker + hex. Default: `#18181b` |
| Tema Auth | `auth_theme` | Não | Select: dark / light. Default: dark |
| Logo | `logo` | Não | `type="file"`, PNG/SVG/WebP, máx 2MB |
| Favicon | `favicon` | Não | `type="file"`, PNG/ICO, máx 512KB |
| Imagem de Fundo Auth | `auth_bg` | Não | `type="file"`, JPG/PNG/WebP, máx 5MB |

### Card 4 — Dados Bancários *(todos opcionais)*

| Campo | Name |
|---|---|
| Banco | `bank_name` |
| Agência | `bank_agency` |
| Conta | `bank_account` |
| Chave PIX | `bank_pix_key` |

---

## Listagem

**Colunas:** Nome · Slug · Status · Criado em · Ações

**Ações:** ícone `<Pencil>` → `/tenants/[id]/edit` (link futuro, não implementado)

**Badges:**
- Status: `pending` (amarelo) · `active` (verde) · `suspended` (laranja) · `cancelled` (vermelho)

**Empty state:** mensagem + botão "Cadastrar primeiro parceiro"

---

## Validação Zod (actions.ts)

```typescript
const tenantSchema = z.object({
  name: z.string().min(2).max(100),
  company_name: z.string().min(2).max(150).optional().nullable(),
  cnpj: z.string().optional().nullable(),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  slug: z.string().min(2).max(63).regex(/^[a-z0-9-]+$/),
  custom_domain: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  bank_agency: z.string().optional().nullable(),
  bank_account: z.string().optional().nullable(),
  bank_pix_key: z.string().optional().nullable(),
})

const brandingSchema = z.object({
  company_display_name: z.string().optional().nullable(),
  primary_color: z.string().optional().nullable(),
  secondary_color: z.string().optional().nullable(),
  auth_bg_color: z.string().optional().nullable(),
  auth_theme: z.enum(['dark', 'light']).optional(),
  logo_url: z.string().url().optional().nullable(),
  favicon_url: z.string().url().optional().nullable(),
  auth_bg_image_url: z.string().url().optional().nullable(),
})
```

---

## Storage — Bucket `tenant-assets`

### Migration

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets', 'tenant-assets', true, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/svg+xml','image/x-icon']
);

-- Apenas backoffice escreve
CREATE POLICY "tenant_assets_backoffice_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'tenant-assets' AND
    (auth.jwt() ->> 'user_role') IN ('super_admin','admin','financial','support')
  );
CREATE POLICY "tenant_assets_backoffice_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'tenant-assets' AND
    (auth.jwt() ->> 'user_role') IN ('super_admin','admin','financial','support')
  );
CREATE POLICY "tenant_assets_backoffice_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'tenant-assets' AND
    (auth.jwt() ->> 'user_role') IN ('super_admin','admin','financial','support')
  );
```

Bucket público → leitura irrestrita, sem policy de SELECT necessária.

### Paths

```
tenant-assets/[tenant_id]/logo
tenant-assets/[tenant_id]/favicon
tenant-assets/[tenant_id]/auth-bg
```

### Upload na Server Action (createTenant)

1. INSERT tenant → obtém `tenant.id`
2. Para cada arquivo presente no FormData: upload via `createServiceClient()` (bypassa RLS)
3. Obtém `publicUrl` via `getPublicUrl()`
4. UPDATE `tenant_branding` com URLs + demais campos

## Color Picker

Sem lib externa. `<input type="color">` (swatch nativo) sincronizado com `<Input type="text">` (hex editável) + `<input type="hidden" name={name} value={color} />` para envio no FormData.

---

## RLS — Verificação Completa

| Recurso | Política | Status |
|---|---|---|
| `tenants` | Backoffice full access | ✅ Aplicada |
| `tenant_branding` | Backoffice full + tenant isolation | ✅ Aplicada |
| `storage.objects` (tenant-assets) | Público leitura; backoffice escrita | ⚠️ Migration necessária |

---

## Fora do Escopo desta Iteração

- Preview em tempo real do branding (tela de login)
- Edição, ativação, suspensão (F3–F7)
- Verificação de slug único via debounce
- Instrução de DNS para domínio customizado

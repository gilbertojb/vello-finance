# Feature Spec — Gestão de Tenants

**App:** `apps/admin` — Vello Admin
**Módulo:** Admin / Tenants
**Terminologia UI:** "Parceiros" (banco de dados permanece `tenants`)
**Status:** `in-progress`
**Prioridade:** Alta

## Status de Implementação

| Feature | Status | Notas |
|---|---|---|
| F1 — Listagem | ✅ Implementado | — |
| F2 — Cadastro | ✅ Implementado | Form em cards; sem plan_id; tipo fixo em whitelabel; sem upload de arquivos |
| F3 — Ativar | ⏳ Pendente | — |
| F4 — Editar | ⏳ Pendente | — |
| F5 — Produtos | ⏳ Pendente | — |
| F6 — Suspender/Cancelar | ⏳ Pendente | — |
| F7 — Detalhes | ⏳ Pendente | — |

## Decisões Técnicas (MVP)

- `type` fixo em `whitelabel` no cadastro — sem campo no formulário por ora
- `plan_id` tornado nullable via migration — associação de plano adiada para módulo de assinaturas
- Formulário de cadastro em **cards** (não wizard 5 steps como planejado originalmente)
- Upload de logo/favicon/imagem para Supabase Storage adiado — campos de URL texto por ora
- `custom_domain` sempre visível no form (todos são white-label)

---

## Tipos de Tenant

| | White-Label | Subscription (SaaS) |
|---|---|---|
| Modelo comercial | Pagamento único (setup) + % comissões | Mensalidade recorrente + % comissões |
| Identidade visual | Totalmente customizada | Identidade Vello padrão |
| URL | Domínio próprio (`creditos.empresa.com.br`) | Subdomínio Vello (`slug.vellofinance.com.br`) |
| Telas públicas | Logo, cores e imagem de fundo customizados | Layout Vello padrão |
| Onboarding | Assistido pela equipe interna | Manual no MVP |
| Customização do Console | Completa | Limitada (logo opcional) |

---

## Modelo de Dados

### Tabela `tenants`

```sql
CREATE TYPE tenant_type AS ENUM ('whitelabel', 'subscription');
CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'cancelled');

CREATE TABLE tenants (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id           UUID NOT NULL REFERENCES plans(id),
  type              tenant_type NOT NULL,
  name              TEXT NOT NULL,
  company_name      TEXT NOT NULL,
  cnpj              TEXT NOT NULL UNIQUE,
  email             TEXT NOT NULL,
  phone             TEXT,
  slug              TEXT NOT NULL UNIQUE,
  custom_domain     TEXT UNIQUE,             -- apenas white-label
  status            tenant_status NOT NULL DEFAULT 'pending',
  activated_at      TIMESTAMPTZ,
  suspended_at      TIMESTAMPTZ,
  bank_name         TEXT,
  bank_agency       TEXT,
  bank_account      TEXT,
  bank_pix_key      TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Tabela `tenant_branding`

Armazena a identidade visual usada nas telas públicas do Console e Store.

```sql
CREATE TABLE tenant_branding (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url              TEXT,
  favicon_url           TEXT,
  primary_color         TEXT NOT NULL DEFAULT '#3B5BBE',
  secondary_color       TEXT NOT NULL DEFAULT '#1E3A5F',
  -- Telas públicas (sign-in, forgot-password, reset-password)
  auth_bg_image_url     TEXT,              -- imagem painel direito
  auth_bg_color         TEXT NOT NULL DEFAULT '#18181b',   -- fundo painel esquerdo
  auth_theme            TEXT NOT NULL DEFAULT 'dark'
                        CHECK (auth_theme IN ('dark', 'light')),
  company_display_name  TEXT,             -- nome exibido nas telas
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cria branding padrão automaticamente ao criar tenant
CREATE OR REPLACE FUNCTION create_default_branding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_branding (tenant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_branding
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_branding();

CREATE TRIGGER trg_set_updated_at_tenants
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_set_updated_at_tenant_branding
  BEFORE UPDATE ON tenant_branding
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

---

## Funcionalidades

### F1 — Listagem · `src/app/(private)/tenants/page.tsx`

**Cards de resumo:** Tenants ativos · White-Labels · Subscriptions · Pendentes de ativação

**Colunas da tabela:** Nome · CNPJ · Tipo · Plano · Status · Domínio · Criado em · Ações

**Filtros:** Tipo (Todos / White-Label / Subscription) · Status · Busca por nome, CNPJ, slug

**Critérios de Aceite:**
- [ ] Badge de tipo: `WL` (navy) para white-label, `SaaS` (blue) para subscription
- [ ] Badge de status com cores semânticas (ver `docs/ui/design-system.md`)
- [ ] Clique na linha → detalhes do tenant

---

### F2 — Criar Tenant · `src/app/(private)/tenants/new/page.tsx`

Formulário em **5 steps** com stepper visual no topo:

#### Step 1 — Tipo e Plano

| Campo | Tipo | Obrigatório |
|---|---|---|
| Tipo | Radio cards | Sim |
| Plano | Select | Sim |

Radio cards com descrição de cada tipo:
- **White-Label** — "Identidade visual própria, domínio customizado, setup único"
- **Subscription** — "Identidade Vello, subdomínio padrão, mensalidade recorrente"

Ao selecionar plano: card informativo com comissão padrão e features incluídas.

#### Step 2 — Dados da Empresa

| Campo | Obrigatório | Validação |
|---|---|---|
| Nome Fantasia | Sim | 2–100 chars |
| Razão Social | Sim | 2–150 chars |
| CNPJ | Sim | Dígitos verificadores |
| Email de Contato | Sim | Formato válido |
| Telefone | Não | — |

#### Step 3 — Configuração da Loja

| Campo | Obrigatório | Detalhe |
|---|---|---|
| Slug | Sim | Auto-gerado do nome fantasia. Preview em tempo real: `[slug].vellofinance.com.br` |
| Domínio Customizado | Só se White-Label | Ex: `creditos.empresa.com.br` |

**Critérios:**
- [ ] Slug: lowercase, sem acentos, hífens no lugar de espaços
- [ ] Verificação de slug único via debounce (query no banco)
- [ ] Campo domínio visível apenas para White-Label
- [ ] Instruções de DNS para domínio customizado exibidas após salvar

#### Step 4 — Identidade Visual (Branding)

**Campos comuns (ambos os tipos):**

| Campo | Obrigatório | Detalhe |
|---|---|---|
| Logo | Não | PNG, SVG, WebP. Máx 2MB |
| Cor Primária | Sim | Color picker + hex. Default: `#3B5BBE` |
| Cor Secundária | Sim | Color picker + hex. Default: `#1E3A5F` |

**Campos extras (apenas White-Label):**

| Campo | Obrigatório | Detalhe |
|---|---|---|
| Favicon | Não | PNG, ICO. Máx 512KB |
| Tema das telas públicas | Sim | Dark / Light. Default: Dark |
| Cor de fundo do painel de login | Sim | Color picker. Default dark: `#18181b` |
| Imagem de fundo (painel direito) | Não | JPG/PNG/WebP. Máx 5MB. Proporção recomendada: 3:2 |
| Nome de exibição | Não | Nome exibido nas telas públicas |

**Preview em tempo real** da tela de sign-in do Console (componente `<TenantBrandingPreview />`):

```
┌──────────────────────────────────────────┐
│ Preview — Tela de Login                   │
├─────────────────┬────────────────────────┤
│  [auth_bg_color]│                        │
│                 │  [auth_bg_image]       │
│  [logo]         │                        │
│                 │  (fallback: gradiente  │
│  Acesse sua     │   primary→secondary)   │
│  conta          │                        │
│                 │                        │
│  [email input]  │                        │
│  [pass input]   │                        │
│  [btn primary]  │                        │
└─────────────────┴────────────────────────┘
```

**Critérios:**
- [ ] Upload salvo em `tenant-assets/[tenant_id]/logo` no Supabase Storage
- [ ] Preview atualiza em tempo real ao mudar qualquer campo de branding
- [ ] Color picker com input hex validado
- [ ] Campos White-Label ocultos para Subscription

#### Step 5 — Dados Bancários (opcional)

Banco · Agência · Conta · Chave Pix — todos opcionais, preenchíveis depois.

**Ao finalizar:**
- [ ] Tenant criado com `status = 'pending'`
- [ ] `tenant_branding` criado via trigger com os valores do step 4
- [ ] Redirect para detalhes com banner de ação: *"Tenant criado. Adicione produtos e ative."*

---

### F3 — Ativar Tenant

**Gatilho:** Botão na página de detalhes quando `status = 'pending'`

**Validações antes de ativar:**
- Ao menos 1 produto habilitado → **bloqueia** com mensagem
- Logo enviada → warning (não bloqueia)
- Dados bancários preenchidos → warning (não bloqueia)

**Pré-requisito:** a tabela `tenant_users` deve existir antes de implementar esta action. A migration `20260409000000_create_tenant_users.sql` é criada junto ao MVP do `apps/console` (ver `docs/superpowers/specs/2026-04-09-console-app-design.md`).

**Fluxo de ativação (Server Action com `createServiceClient()` de `@/lib/supabase/service`):**

```typescript
// 1. Cria usuário no Supabase Auth
const supabase = createServiceClient()
const { data: authUser } = await supabase.auth.admin.createUser({
  email: tenant.email,
  email_confirm: true,
})

// 2. Insere em tenant_users (tabela criada na migration do console)
await supabase.from('tenant_users').insert({
  id: authUser.user.id,
  tenant_id: tenant.id,
  role: 'tenant_admin',
})

// 3. Envia magic link para o tenant definir senha
await supabase.auth.admin.generateLink({
  type: 'magiclink',
  email: tenant.email,
})

// 4. Atualiza status
await supabase.from('tenants').update({
  status: 'active',
  activated_at: new Date().toISOString(),
}).eq('id', tenant.id)

// 5. Dispara TenantWelcomeEmail via Resend (packages/transactional)
```

**Critérios de Aceite:**
- [ ] Modal de confirmação antes de ativar
- [ ] Se white-label: exibe instruções de DNS após ativação
- [ ] Link da loja exibido na página de detalhes após ativação
- [ ] Email de boas-vindas enviado com magic link para definir senha

---

### F4 — Editar Tenant · `src/app/(private)/tenants/[id]/edit/page.tsx`

Mesmas seções do formulário de criação, organizadas em **abas** (não steps):

- **Aba 1:** Dados da Empresa
- **Aba 2:** Loja (slug / domínio)
- **Aba 3:** Identidade Visual
- **Aba 4:** Dados Bancários

**Campos read-only após criação:** CNPJ · Tipo (com tooltip explicativo)

---

### F5 — Gerenciar Produtos · `src/app/(private)/tenants/[id]/products/page.tsx`

Para cada produto ativo da Vello:

```
┌─────────────────────────────────────────────────────────┐
│ FGTS — Saque Aniversário                  [Toggle]      │
├─────────────────────────────────────────────────────────┤
│ Banco paga à Vello:      10,0000%                       │
│ Vello retém:              5,0000%                       │
│ Disponível ao tenant:     5,0000%                       │
│                                                         │
│ Comissão do Tenant:  [___3,5000___] %                   │
│ Spread Vello (auto):      1,5000%  ← calculado em tempo real
└─────────────────────────────────────────────────────────┘
```

**Critérios:**
- [ ] Comissão pré-preenchida com padrão do plano do tenant
- [ ] Spread Vello calculado e exibido em tempo real
- [ ] Erro se comissão > disponível ao tenant
- [ ] Toggle off: `is_active = false` (registro mantido para histórico)

---

### F6 — Suspender / Cancelar / Reativar

| Status atual | Ações disponíveis |
|---|---|
| `pending` | Ativar · Cancelar |
| `active` | Suspender · Cancelar |
| `suspended` | Reativar · Cancelar |
| `cancelled` | — somente leitura |

**Suspensão:** proxy do Console bloqueia acesso · dados preservados · `suspended_at` preenchido

**Cancelamento:** irreversível · modal exige digitar nome do tenant · soft delete via status

---

### F7 — Detalhes do Tenant · `src/app/(private)/tenants/[id]/page.tsx`

**Layout duas colunas:**

Coluna esquerda (2/3) com tabs:
- **Dados Cadastrais** — dados da empresa, slug, domínio
- **Produtos** — produtos habilitados e comissões
- **Financeiro** — métricas e extrato (placeholder no MVP)
- **Identidade Visual** — preview do branding + link de edição

Coluna direita (1/3):
- Card de ações (ativar / suspender / editar)
- Preview miniatura da tela de sign-in (white-label)
- Métricas rápidas: propostas, volume, comissões geradas

---

## Customização das Telas Públicas — Console

### Fluxo de resolução do branding

```
GET creditos.empresa.com.br/sign-in
  ↓
proxy do Console (proxy.ts)
  ↓
SELECT * FROM tenants WHERE custom_domain = hostname
SELECT * FROM tenant_branding WHERE tenant_id = tenant.id
  ↓
Injeta headers:
  x-tenant-id: uuid
  x-tenant-branding: JSON.stringify(branding)
  ↓
(public)/layout.tsx lê os headers
  ↓
Aplica CSS variables + renderiza layout com branding do tenant
```

### Layout das telas públicas — `apps/console/src/app/(public)/layout.tsx` (lê headers injetados por `proxy.ts`)

Baseado no print do cliente white-label (split 40/60, dark theme):

```
┌──────────────── 40% ────────────────┬─────────── 60% ────────────┐
│ background: auth_bg_color           │                             │
│                                     │  auth_bg_image_url          │
│ [logo do tenant — topo esquerdo]    │  (object-cover)             │
│                                     │                             │
│       [children — formulário]       │  Fallback se sem imagem:    │
│       centralizado verticalmente    │  gradiente                  │
│                                     │  primary_color →            │
│                                     │  secondary_color            │
│                                     │                             │
└─────────────────────────────────────┴─────────────────────────────┘
```

**CSS variables injetadas pelo layout:**
```css
--tenant-primary:       primary_color
--tenant-primary-hover: primary_color com 10% mais escuro (calculado)
--tenant-bg:            auth_bg_color
--tenant-text:          calculado por contraste com auth_bg_color
```

**Telas públicas que usam este layout:**
- `/sign-in` — formulário de login
- `/forgot-password` — solicitar reset de senha
- `/reset-password` — definir nova senha (magic link)

**Critérios de Aceite:**
- [ ] Layout split 40/60 responsivo (em mobile: empilhado, imagem oculta)
- [ ] Logo do tenant no topo esquerdo, fallback logo Vello
- [ ] Botão usa `--tenant-primary` como background
- [ ] Sem imagem: painel direito exibe gradiente `primary → secondary`
- [ ] Tema dark/light baseado em `auth_theme` do branding
- [ ] Subscription sem branding customizado: layout Vello padrão

---

## Supabase Storage

```
Bucket: tenant-assets (acesso público via signed URLs)

tenant-assets/
└── [tenant_id]/
    ├── logo          ← logo_url
    ├── favicon       ← favicon_url
    └── auth-bg       ← auth_bg_image_url
```

**Server Action de upload:**
```typescript
// Usar createServiceClient() de @/lib/supabase/service — não expor ao browser
const supabase = createServiceClient()
const { data } = await supabase.storage
  .from('tenant-assets')
  .upload(`${tenantId}/logo`, file, { upsert: true })

const { data: { publicUrl } } = supabase.storage
  .from('tenant-assets')
  .getPublicUrl(`${tenantId}/logo`)

// Salvar publicUrl em tenant_branding.logo_url
```

---

## Arquivos a Criar

```
apps/admin/src/app/(private)/tenants/
├── page.tsx
├── new/page.tsx
├── [id]/
│   ├── page.tsx
│   ├── edit/page.tsx
│   └── products/page.tsx
├── actions.ts
├── queries.ts
└── _components/
    ├── tenant-table.tsx
    ├── tenant-type-badge.tsx
    ├── tenant-status-badge.tsx
    ├── tenant-status-actions.tsx
    ├── tenant-form-steps.tsx
    ├── tenant-branding-form.tsx
    ├── tenant-branding-preview.tsx   ← preview em tempo real da tela de sign-in
    └── tenant-products-manager.tsx

apps/console/src/app/(public)/
├── layout.tsx                        ← split 40/60 com branding do tenant
├── sign-in/page.tsx
├── forgot-password/page.tsx
└── reset-password/page.tsx

supabase/migrations/
├── 20260401130000_create_tenants.sql
├── 20260401131000_create_tenant_branding.sql
├── 20260401132000_create_tenant_branding_trigger.sql
└── 20260401140000_create_tenant_products.sql
```

---

## Fora do Escopo desta Feature

- Self-service de onboarding pelo próprio tenant
- Cobrança automática de mensalidade
- Provisionamento automático de subdomínio via Vercel API
- Tenant editar seu próprio branding pelo Console
- Múltiplos usuários por tenant (apenas 1 `tenant_admin` por ora)

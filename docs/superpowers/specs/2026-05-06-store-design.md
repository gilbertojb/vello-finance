# Spec: Vello Store — MVP

**Data:** 2026-05-06
**App:** `apps/store`
**Status:** aprovado
**Escopo:** Home (landing page), Simulador de produto, Formulário de solicitação em 2 passos, tela de confirmação e criação de simulação na pipeline.

---

## Contexto

O `apps/store` já tem estrutura base: `layout.tsx` com injeção de CSS do tenant, `proxy.ts` com resolução de tenant por subdomínio/custom domain, e páginas de erro (`/not-found`, `/unavailable`). Esta spec define as rotas públicas do fluxo do cliente final.

A store é **completamente pública** — nenhuma autenticação é necessária para navegar, simular ou submeter uma solicitação. O `tenant_id` é injetado pelo middleware a partir do host, nunca pelo cliente.

---

## Seção 1 — Fluxo e Rotas

```
/                          → Home: landing page + grid de produtos ativos
/produto/[id]              → Simulador do produto selecionado
/solicitar/[id]            → Formulário de solicitação em 2 passos
/confirmacao/[proposalId]  → Tela de sucesso após envio
```

### Estrutura de arquivos

```
apps/store/src/
├── app/
│   ├── layout.tsx                     ← já existe — branding CSS, metadata dinâmica
│   ├── providers.tsx                  ← já existe
│   ├── globals.css                    ← já existe
│   ├── not-found/page.tsx             ← já existe
│   ├── unavailable/page.tsx           ← já existe
│   └── (store)/
│       ├── layout.tsx                 ← Header (logo tenant) + Footer
│       ├── page.tsx                   ← Home
│       ├── produto/
│       │   └── [id]/
│       │       └── page.tsx           ← Simulador
│       ├── solicitar/
│       │   └── [id]/
│       │       ├── page.tsx           ← Formulário (step via query param)
│       │       ├── actions.ts         ← createProposal Server Action
│       │       └── _components/
│       │           ├── step-indicator.tsx
│       │           ├── step-one-form.tsx
│       │           └── step-two-form.tsx
│       └── confirmacao/
│           └── [id]/
│               └── page.tsx           ← Tela de sucesso
├── components/
│   └── ui/                            ← shadcn/ui (Button, Input, Select, Slider, etc.)
└── lib/
    ├── supabase/                       ← já existe (client, server, service, proxy)
    ├── tenant/resolve-tenant.ts        ← já existe
    ├── branding.ts                     ← já existe
    └── utils.ts                        ← já existe
```

---

## Seção 2 — Layout da Store (`(store)/layout.tsx`)

Server Component. Lê `x-tenant-id` e `x-tenant-slug` dos headers e busca branding via `createServiceClient()`.

**Header:** logo do tenant (fallback: `company_display_name` como texto) + link para home.

**Footer:** `© [ano] [company_display_name]` + links básicos (Política de Privacidade, Termos).

Usa tokens semânticos (`bg-background`, `text-foreground`, `bg-primary`, `text-primary-foreground`) para responder ao tema do tenant via CSS variables injetadas no root layout.

---

## Seção 3 — Home (`(store)/page.tsx`)

Server Component. Composta por 4 blocos:

### Bloco 1 — Hero

- Headline e subheadline: **copy TBD** — placeholders genéricos até o usuário enviar o copy final.
- CTA "Ver produtos" ancora para a seção de produtos.
- Imagem/gradiente de fundo: `auth_bg_image_url` do branding (fallback: gradiente `from-primary/80 to-primary`).

### Bloco 2 — Produtos

Lista os `tenant_products` ativos do tenant com join em `products`:

```typescript
// app/(store)/queries.ts
export async function listActiveProducts(tenantId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('tenant_products')
    .select(`
      id,
      cover_url,
      products (
        id, name, type, description,
        min_amount, max_amount,
        min_term_months, max_term_months,
        min_rate_monthly, max_rate_monthly
      )
    `)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('created_at')
  return data ?? []
}
```

**Card de produto:** `cover_url` (fallback: gradiente por tipo), nome, faixa de valores (`min_amount`–`max_amount`), prazo (`min_term_months`–`max_term_months`), botão "Simular" → `/produto/[tenant_product.id]`.

> O `[id]` nas rotas de produto e solicitação é o `tenant_products.id` (não o `products.id`), pois é o vínculo tenant+produto que determina o contexto da simulação.

### Bloco 3 — "Por que [company_display_name]?"

4 blocos de value props com ícone + título + texto. **Copy TBD.** Estrutura fixa de layout, substituída quando o copy chegar.

### Bloco 4 — Footer

Renderizado pelo `(store)/layout.tsx`.

---

## Seção 4 — Simulador (`(store)/produto/[id]/page.tsx`)

Server Component. Busca `tenant_products JOIN products` pelo `id` (tenant_product id). Redireciona para `/not-found` se produto não existir ou não pertencer ao tenant.

### Layout (split desktop, empilhado mobile)

```
┌─────────────────────────┬─────────────────────────┐
│  PAINEL ESQUERDO        │  PAINEL DIREITO          │
│                         │                          │
│  [Nome do produto]      │  Parcela estimada        │
│  [Descrição pública]    │  R$ --,--  ← TBD         │
│                         │                          │
│  Valor desejado         │  Total a pagar           │
│  [slider]               │  R$ --,--  ← TBD         │
│  R$ min ────── R$ max   │                          │
│                         │  Taxa a partir de        │
│  Prazo                  │  X,XX% a.m.              │
│  [tabs: opções de prazo]│                          │
│                         │  ──────────────────────  │
│                         │  [Solicitar agora]       │
│                         │  [← Voltar]              │
└─────────────────────────┴─────────────────────────┘
```

### Regras

- **Slider de valor:** `min_amount` a `max_amount` do produto. Passos de R$ 1.000.
- **Tabs de prazo:** geradas a partir de `min_term_months` e `max_term_months` em intervalos de 12 meses, máximo de 5 opções. Exemplo: min=12, max=60 → [12, 24, 36, 48, 60]. Se min = max, exibe apenas uma opção. Se o range gerar mais de 5 pontos, distribui 5 igualmente.
- **Taxa:** exibe `min_rate_monthly` como "a partir de X,XX% a.m." — sem cálculo real por enquanto.
- **Parcela e total:** exibidos como `--` até as fórmulas serem implementadas (próxima spec).
- **"Solicitar agora"** → `/solicitar/[id]?amount=[valor]&term=[prazo]`
- O painel direito é Client Component (`_components/simulator-panel.tsx`) para reagir ao slider. Recebe `minAmount`, `maxAmount`, `minTerm`, `maxTerm`, `minRate` como props.

---

## Seção 5 — Formulário (`(store)/solicitar/[id]/page.tsx`)

Server Component que lê `?step=1` (default) ou `?step=2`. Layout split igual ao mockup: painel esquerdo dark com branding (35%) + painel direito com form (65%).

**Controle de passo:** query param `?step=` — sem estado client-side entre reloads. Ao avançar, `step-one-form.tsx` redireciona para `?step=2` via `router.push`.

> Os dados do passo 1 são transportados para o passo 2 como **hidden inputs** dentro do `<form>` do passo 2. O Server Action `createProposal` recebe `FormData` completo com os campos de ambos os passos em uma única chamada.

### Passo 1 — Dados da simulação

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| Finalidade do crédito | `select` | Sim | enum: `pessoal`, `empresa`, `imovel`, `veiculo`, `outro` |
| Valor desejado | `input` (R$) | Sim | entre `min_amount` e `max_amount` do produto |
| Nome completo | `input` | Sim | mín. 3 chars |
| E-mail | `input email` | Sim | formato válido |
| Prazo desejado | `select` / slider | Sim | entre `min_term_months` e `max_term_months` |

Rodapé do formulário: resumo "Parcela estimada: --,-- · Taxa: X,XX% a.m." (mesmo padrão do simulador).

CTA: **Continuar →**

### Passo 2 — Dados pessoais

| Campo | Tipo | Obrigatório | Validação |
|---|---|---|---|
| CPF | `input` (máscara 000.000.000-00) | Sim | 11 dígitos, validação de dígito verificador |
| Telefone | `input` (máscara (00) 00000-0000) | Sim | 10 ou 11 dígitos |
| Data de nascimento | `input date` | Sim | idade ≥ 18 anos |
| CEP | `input` (máscara 00000-000) | Sim | auto-preenchimento via ViaCEP |
| Rua | `input` | Sim | preenchido pelo CEP |
| Número | `input` | Sim | |
| Complemento | `input` | Não | |
| Bairro | `input` | Sim | preenchido pelo CEP |
| Cidade | `input` | Sim | preenchido pelo CEP, read-only |
| UF | `input` (2 chars) | Sim | preenchido pelo CEP, read-only |

CTA: **Enviar solicitação** (chama `createProposal` Server Action).

Botão voltar: retorna para `?step=1` preservando dados via hidden inputs.

### Server Action `createProposal`

```typescript
// app/(store)/solicitar/[id]/actions.ts
'use server'

export async function createProposal(formData: FormData) {
  // 1. Validar todos os campos (zod)
  // 2. Ler tenant_id de headers() — injetado pelo middleware, confiável
  // 3. Buscar tenant_product para confirmar que product_id pertence ao tenant
  // 4. Inserir em proposals via createServiceClient() (bypassa RLS)
  // 5. redirect(`/confirmacao/${proposal.id}`)
}
```

**Contrato de retorno:**
```ts
{ success: boolean; message: string | null; errors: Record<string, string[]> | null }
```

---

## Seção 6 — Tela de Confirmação (`(store)/confirmacao/[id]/page.tsx`)

Server Component. Busca a proposal pelo `id` + `tenant_id` (confirma que pertence ao tenant atual). Exibe:

- Ícone de sucesso
- Título: "Solicitação recebida!"
- Subtítulo: nome do cliente + produto
- Número de protocolo: primeiros 8 chars do `proposal.id` em maiúsculas
- CTA: "Fazer nova simulação" → `/`

Se `id` não existir ou não pertencer ao tenant: redirect para `/not-found`.

---

## Seção 7 — Migration: `proposals`

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_proposals.sql

CREATE TABLE proposals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  product_id           UUID NOT NULL REFERENCES products(id),

  -- Status e pipeline
  status               TEXT NOT NULL DEFAULT 'simulation'
                       CHECK (status IN (
                         'simulation',
                         'in_pipeline',
                         'approved',
                         'rejected',
                         'cancelled'
                       )),
  stage_id             UUID REFERENCES proposal_stages(id), -- NULL enquanto simulation

  -- Dados da simulação
  purpose              TEXT CHECK (purpose IN (
                         'pessoal','empresa','imovel','veiculo','outro'
                       )),
  desired_amount       NUMERIC(12,2) NOT NULL,
  desired_term_months  INT NOT NULL,
  estimated_rate       NUMERIC(6,4),
  estimated_payment    NUMERIC(12,2),

  -- Dados do cliente
  client_name          TEXT NOT NULL,
  client_email         TEXT NOT NULL,
  client_cpf           TEXT NOT NULL,
  client_phone         TEXT NOT NULL,
  client_birthdate     DATE NOT NULL,
  client_address       JSONB NOT NULL,
  -- { zip, street, number, complement, neighborhood, city, state }

  -- Timestamps
  submitted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at          TIMESTAMPTZ,
  rejected_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_proposals
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_proposals_tenant_status ON proposals(tenant_id, status);
CREATE INDEX idx_proposals_tenant_created ON proposals(tenant_id, created_at DESC);

-- RLS: Categoria B com insert via service client
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON proposals
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_isolation" ON proposals
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );
```

> INSERT da store é feito via `createServiceClient()` (service role key — server-side only), que bypassa RLS. O `tenant_id` é lido de `headers().get('x-tenant-id')` — injetado pelo middleware, nunca pelo cliente.

---

## Seção 8 — Regras de UI

- **Tokens semânticos obrigatórios** — nenhuma cor hardcoded. `bg-primary`, `text-primary-foreground`, `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border` etc. O tema do tenant sobrescreve via CSS variables em `[data-tenant-theme="slug"]`.
- **Sem queries Supabase em Client Components** — todos os dados chegam via props do Server Component pai.
- **CEP lookup (ViaCEP):** Route Handler em `/api/cep/[cep]` que faz o fetch para a ViaCEP server-side e retorna `{ street, neighborhood, city, state }`. O Client Component chama este Route Handler ao detectar CEP completo (8 dígitos) — nunca chama ViaCEP diretamente do browser.
- **Máscara de CPF/telefone:** lib client-side (ex: `@react-input/mask`) — Client Component apenas para o input, sem acesso a dados.

---

## Seção 9 — Fora do Escopo desta Spec

- Fórmulas de cálculo de parcela/total (próxima spec — usuário enviará as fórmulas por produto)
- OTP de verificação de telefone/e-mail
- Área de acompanhamento de proposta pelo cliente
- "Salvar simulação" (favoritos)
- Tabela `clients` separada (normalização futura)
- Copy final do hero e da seção "Por que [tenant]?" (usuário enviará depois)

---

## Critérios de Aceite

- [ ] Middleware resolve tenant e store redireciona para `/not-found` se tenant inativo ou inexistente
- [ ] Home lista apenas `tenant_products` com `is_active = true` do tenant correto
- [ ] Simulador exibe faixas de valor e prazo corretas do produto; campos de cálculo exibem `--`
- [ ] Formulário passo 1 valida todos os campos antes de avançar
- [ ] Formulário passo 2 valida CPF (dígito verificador), idade ≥ 18, CEP com auto-preenchimento
- [ ] `createProposal` lê `tenant_id` de `headers()` — nunca aceita do cliente
- [ ] Proposta criada com `status = 'simulation'` e `stage_id = NULL`
- [ ] Tela de confirmação exibe número de protocolo e nome do cliente
- [ ] Nenhum token de cor hardcoded — todos os componentes respondem ao tema do tenant
- [ ] Nenhuma query Supabase em Client Components

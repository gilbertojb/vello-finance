# Modelo de Dados — Vello Finance

> Banco centralizado no Supabase. RLS garante isolamento entre tenants.
> Tabelas globais (`products`, `plans`) são gerenciadas pelo backoffice e lidas por todos.

## Módulo Admin

### `plans`
```sql
CREATE TABLE plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('signature', 'white_label')),
  monthly_fee     NUMERIC(10,2),                    -- NULL para white-label
  setup_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_pct  NUMERIC(5,4) NOT NULL,            -- % padrão repassado ao tenant
  max_products    INT,                              -- NULL = ilimitado
  features        JSONB NOT NULL DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `tenants`
```sql
CREATE TABLE tenants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id         UUID REFERENCES plans(id),        -- Nullable: pode ser atribuído depois
  name            TEXT NOT NULL,                    -- Nome fantasia
  company_name    TEXT,                             -- Razão social (nullable até ativação)
  cnpj            TEXT UNIQUE,                      -- Nullable até ativação
  email           TEXT NOT NULL,
  phone           TEXT,
  slug            TEXT NOT NULL UNIQUE,             -- [slug].vellofinance.com.br
  custom_domain   TEXT UNIQUE,                      -- White-label: domínio próprio
  logo_url        TEXT,
  primary_color   TEXT NOT NULL DEFAULT '#2563EB',
  secondary_color TEXT NOT NULL DEFAULT '#1E3A5F',
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','suspended','cancelled')),
  bank_name       TEXT,
  bank_agency     TEXT,
  bank_account    TEXT,
  bank_pix_key    TEXT,
  activated_at    TIMESTAMPTZ,
  suspended_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `financial_partners`
```sql
CREATE TABLE financial_partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  api_base_url    TEXT,
  api_key_enc     TEXT,           -- Criptografado — nunca expor
  webhook_secret  TEXT,           -- Para validar webhooks recebidos
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `products`
```sql
CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Sem financial_partner_id: relação N:N via product_financial_partners
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN (
                          'fgts','consignado_publico','consignado_privado',
                          'home_equity','auto_equity','outros'
                        )),
  description           TEXT,
  internal_description  TEXT,
  min_amount            NUMERIC(12,2),
  max_amount            NUMERIC(12,2),
  min_term_months       INT,
  max_term_months       INT,
  min_rate_monthly      NUMERIC(6,2),
  max_rate_monthly      NUMERIC(6,2),
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `product_financial_partners`
```sql
-- Relação N:N entre produtos e instituições financeiras.
-- Comissão negociada por par produto + IF.
CREATE TABLE product_financial_partners (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  financial_partner_id UUID NOT NULL REFERENCES financial_partners(id),
  if_commission_pct    NUMERIC(6,3) NOT NULL,  -- % que a IF paga à Vello (ex: 3.755)
  vello_commission_pct NUMERIC(6,3) NOT NULL,  -- % que a Vello retém
  -- Disponível ao tenant = if_commission_pct - vello_commission_pct
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(product_id, financial_partner_id),
  CONSTRAINT commission_valid CHECK (vello_commission_pct <= if_commission_pct)
);
```

### `tenant_products`
```sql
CREATE TABLE tenant_products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES products(id),
  tenant_commission_pct NUMERIC(6,3) NOT NULL,      -- % que o tenant recebe (ex: 3.755)
  vello_spread_pct      NUMERIC(6,3) NOT NULL,      -- % adicional que a Vello retém
  -- tenant_commission_pct + vello_spread_pct = disponível ao tenant
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, product_id)
);
```

### `commission_snapshots` (append-only)
```sql
-- NUNCA atualizar registros existentes. Append-only.
CREATE TABLE commission_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id               UUID NOT NULL REFERENCES proposals(id),
  product_id                UUID NOT NULL REFERENCES products(id),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  financial_partner_id      UUID NOT NULL REFERENCES financial_partners(id),
  -- Percentuais vigentes no momento da proposta (fonte: product_financial_partners + tenant_products)
  if_commission_pct         NUMERIC(6,3) NOT NULL,   -- renomeado de bank_commission_pct
  vello_commission_pct      NUMERIC(6,3) NOT NULL,
  tenant_commission_pct     NUMERIC(6,3) NOT NULL,
  vello_spread_pct          NUMERIC(6,3) NOT NULL,
  -- Valores em R$ — preenchidos quando proposta for aprovada
  loan_amount               NUMERIC(12,2),
  if_commission_amount      NUMERIC(10,2),           -- renomeado de bank_commission_amount
  vello_commission_amount   NUMERIC(10,2),
  tenant_commission_amount  NUMERIC(10,2),
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT now()
  -- SEM updated_at propositalmente
);
```

## Regra de Negócio: Cascata de Comissões

A comissão é definida por par **produto + instituição financeira** (`product_financial_partners`).
A mesma IF pode ter percentuais diferentes para produtos distintos.

```
IF paga à Vello:          if_commission_pct          ex: 10,00%
Vello retém:              vello_commission_pct        ex:  5,00%
                          ────────────────────────────────────────
Disponível ao tenant:     if - vello                 ex:  5,00%

Desse disponível (5%):
  Tenant recebe:          tenant_commission_pct       ex:  3,50%
  Vello spread:           vello_spread_pct            ex:  1,50%

Total Vello Finance:      vello_commission_pct
                        + vello_spread_pct            ex:  6,50%
Total Tenant:             tenant_commission_pct        ex:  3,50%
Soma total:               if_commission_pct            ex: 10,00% ✓
```

## Tabelas Futuras

- `proposals` — Propostas de empréstimo
- `clients` — Clientes dos tenants
- `documents` — Documentos das propostas (Supabase Storage)
- `commissions` — Comissões calculadas e a pagar
- `cnab_batches` — Lotes de repasse gerados
- `audit_logs` — Log de auditoria de todas as ações sensíveis
- `users` — Usuários internos e dos tenants

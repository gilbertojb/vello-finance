# Modelo de Dados — Vello Finance

> Banco centralizado no Supabase. RLS garante isolamento entre tenants.
> Tabelas globais (`products`, `plans`) são gerenciadas pelo backoffice e lidas por todos.

## Módulo Admin — Tabelas do MVP

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
  plan_id         UUID NOT NULL REFERENCES plans(id),
  name            TEXT NOT NULL,                    -- Nome fantasia
  company_name    TEXT NOT NULL,                    -- Razão social
  cnpj            TEXT NOT NULL UNIQUE,
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
  type            TEXT NOT NULL CHECK (type IN ('qi_tech','bancly','zip','other')),
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
  financial_partner_id  UUID REFERENCES financial_partners(id),
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN (
                          'fgts','consignado_publico','consignado_privado',
                          'home_equity','auto_equity','outros'
                        )),
  description           TEXT,
  min_amount            NUMERIC(12,2),
  max_amount            NUMERIC(12,2),
  min_term_months       INT,
  max_term_months       INT,
  min_rate_monthly      NUMERIC(6,4),
  max_rate_monthly      NUMERIC(6,4),
  -- Cascata de comissão: banco → Vello
  bank_commission_pct   NUMERIC(5,4) NOT NULL,      -- % que o banco paga à Vello
  vello_commission_pct  NUMERIC(5,4) NOT NULL,      -- % que a Vello retém do banco
  -- Disponível ao tenant = bank_commission_pct - vello_commission_pct
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT commission_valid CHECK (vello_commission_pct <= bank_commission_pct)
);
```

### `tenant_products`
```sql
CREATE TABLE tenant_products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES products(id),
  tenant_commission_pct NUMERIC(5,4) NOT NULL,      -- % que o tenant recebe
  vello_spread_pct      NUMERIC(5,4) NOT NULL,      -- % adicional que a Vello retém
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
  -- Percentuais vigentes no momento da proposta
  bank_commission_pct       NUMERIC(5,4) NOT NULL,
  vello_commission_pct      NUMERIC(5,4) NOT NULL,
  tenant_commission_pct     NUMERIC(5,4) NOT NULL,
  vello_spread_pct          NUMERIC(5,4) NOT NULL,
  -- Valores em R$ — preenchidos quando proposta for aprovada
  loan_amount               NUMERIC(12,2),
  bank_commission_amount    NUMERIC(10,2),
  vello_commission_amount   NUMERIC(10,2),
  tenant_commission_amount  NUMERIC(10,2),
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT now()
  -- SEM updated_at propositalmente
);
```

## Regra de Negócio: Cascata de Comissões

```
Banco paga à Vello:       bank_commission_pct        ex: 10,0000%
Vello retém:              vello_commission_pct        ex:  5,0000%
                          ────────────────────────────────────────
Disponível ao tenant:     bank - vello               ex:  5,0000%

Desse disponível (5%):
  Tenant recebe:          tenant_commission_pct       ex:  3,5000%
  Vello spread:           vello_spread_pct            ex:  1,5000%

Total Vello Finance:      vello_commission_pct
                        + vello_spread_pct            ex:  6,5000%
Total Tenant:             tenant_commission_pct        ex:  3,5000%
Soma total:               bank_commission_pct          ex: 10,0000% ✓
```

## Tabelas Futuras (fora do MVP Admin)

- `proposals` — Propostas de empréstimo
- `clients` — Clientes dos tenants
- `documents` — Documentos das propostas (Supabase Storage)
- `commissions` — Comissões calculadas e a pagar
- `cnab_batches` — Lotes de repasse gerados
- `audit_logs` — Log de auditoria de todas as ações sensíveis
- `users` — Usuários internos e dos tenants

# Data Model — Vello Finance

> Centralized database on Supabase. RLS ensures isolation between tenants.
> Global tables (`products`, `plans`) are managed by the backoffice and read by everyone.

## Admin Module

### `plans`
```sql
CREATE TABLE plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('signature', 'white_label')),
  monthly_fee     NUMERIC(10,2),                    -- NULL for white-label
  setup_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_pct  NUMERIC(5,4) NOT NULL,            -- default % passed on to the tenant
  max_products    INT,                              -- NULL = unlimited
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
  plan_id         UUID REFERENCES plans(id),        -- Nullable: can be assigned later
  name            TEXT NOT NULL,                    -- Trade name
  company_name    TEXT,                             -- Legal name (nullable until activation)
  cnpj            TEXT UNIQUE,                      -- Nullable until activation
  email           TEXT NOT NULL,
  phone           TEXT,
  slug            TEXT NOT NULL UNIQUE,             -- [slug].vellofinance.com.br
  custom_domain   TEXT UNIQUE,                      -- White-label: own domain
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
  api_key_enc     TEXT,           -- Encrypted — never expose
  webhook_secret  TEXT,           -- To validate incoming webhooks
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### `products`
```sql
CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- No financial_partner_id: N:N relationship via product_financial_partners
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
-- N:N relationship between products and financial institutions.
-- Commission negotiated per product + FI pair.
CREATE TABLE product_financial_partners (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  financial_partner_id UUID NOT NULL REFERENCES financial_partners(id),
  if_commission_pct    NUMERIC(6,3) NOT NULL,  -- % the FI pays to Vello (e.g.: 3.755)
  vello_commission_pct NUMERIC(6,3) NOT NULL,  -- % Vello retains
  -- Available to the tenant = if_commission_pct - vello_commission_pct
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
  tenant_commission_pct NUMERIC(6,3) NOT NULL,      -- % the tenant receives (e.g.: 3.755)
  vello_spread_pct      NUMERIC(6,3) NOT NULL,      -- additional % Vello retains
  -- tenant_commission_pct + vello_spread_pct = available to the tenant
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, product_id)
);
```

### `commission_snapshots` (append-only)
```sql
-- NEVER update existing records. Append-only.
CREATE TABLE commission_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id               UUID NOT NULL REFERENCES proposals(id),
  product_id                UUID NOT NULL REFERENCES products(id),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  financial_partner_id      UUID NOT NULL REFERENCES financial_partners(id),
  -- Percentages in effect at the time of the proposal (source: product_financial_partners + tenant_products)
  if_commission_pct         NUMERIC(6,3) NOT NULL,   -- renamed from bank_commission_pct
  vello_commission_pct      NUMERIC(6,3) NOT NULL,
  tenant_commission_pct     NUMERIC(6,3) NOT NULL,
  vello_spread_pct          NUMERIC(6,3) NOT NULL,
  -- Values in R$ — filled in once the proposal is approved
  loan_amount               NUMERIC(12,2),
  if_commission_amount      NUMERIC(10,2),           -- renamed from bank_commission_amount
  vello_commission_amount   NUMERIC(10,2),
  tenant_commission_amount  NUMERIC(10,2),
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT now()
  -- NO updated_at, intentionally
);
```

## Business Rule: Commission Cascade

The commission is defined per **product + financial institution** pair (`product_financial_partners`).
The same FI can have different percentages for different products.

```
FI pays Vello:            if_commission_pct          e.g.: 10.00%
Vello retains:            vello_commission_pct        e.g.:  5.00%
                          ────────────────────────────────────────
Available to tenant:      if - vello                 e.g.:  5.00%

Of that available amount (5%):
  Tenant receives:        tenant_commission_pct       e.g.:  3.50%
  Vello spread:           vello_spread_pct            e.g.:  1.50%

Total Vello Finance:      vello_commission_pct
                        + vello_spread_pct            e.g.:  6.50%
Total Tenant:             tenant_commission_pct        e.g.:  3.50%
Total sum:                if_commission_pct            e.g.: 10.00% ✓
```

## Store Module

### `proposals`
```sql
CREATE TABLE proposals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  product_id           UUID NOT NULL REFERENCES products(id),
  status               TEXT NOT NULL DEFAULT 'simulation'
                       CHECK (status IN ('simulation','in_pipeline','approved','rejected','cancelled')),
  stage_id             UUID REFERENCES proposal_stages(id),
  purpose              TEXT CHECK (purpose IN ('pessoal','empresa','imovel','veiculo','outro')),
  desired_amount       NUMERIC(12,2) NOT NULL,
  desired_term_months  INT NOT NULL,
  estimated_rate       NUMERIC(6,4),
  estimated_payment    NUMERIC(12,2),
  client_name          TEXT NOT NULL,
  client_email         TEXT NOT NULL,
  client_cpf           TEXT NOT NULL,
  client_phone         TEXT NOT NULL,
  client_birthdate     DATE NOT NULL,
  client_address       JSONB NOT NULL,
  submitted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at          TIMESTAMPTZ,
  rejected_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

## Future Tables

- `clients` — Tenants' clients
- `documents` — Proposal documents (Supabase Storage)
- `commissions` — Calculated commissions to be paid
- `cnab_batches` — Generated payout batches
- `audit_logs` — Audit log of all sensitive actions
- `users` — Internal and tenant users

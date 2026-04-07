-- Migration: create_tenants
-- Tabela principal de tenants (consultores e white-labels) da plataforma Vello Finance.
-- plan_id, cnpj e company_name são opcionais no cadastro inicial — preenchidos na ativação.
-- RLS: Categoria A — apenas backoffice acessa.

CREATE TYPE tenant_type AS ENUM ('subscription', 'whitelabel');
CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'cancelled');

CREATE TABLE tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID REFERENCES plans(id),         -- Nullable: associado na ativação
  type           tenant_type NOT NULL,
  name           TEXT NOT NULL,                     -- Nome fantasia
  company_name   TEXT,                              -- Razão social (preenchida na ativação)
  cnpj           TEXT UNIQUE,                       -- Preenchido na ativação
  email          TEXT NOT NULL,
  phone          TEXT,
  slug           TEXT NOT NULL UNIQUE,              -- [slug].vellofinance.com.br
  custom_domain  TEXT UNIQUE,                       -- White-label: domínio próprio
  status         tenant_status NOT NULL DEFAULT 'pending',
  activated_at   TIMESTAMPTZ,
  suspended_at   TIMESTAMPTZ,
  bank_name      TEXT,
  bank_agency    TEXT,
  bank_account   TEXT,
  bank_pix_key   TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_tenants
  BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenants
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

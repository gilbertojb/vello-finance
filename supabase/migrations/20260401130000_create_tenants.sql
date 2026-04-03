-- Migration: create_tenants
-- Tabela principal de tenants (consultores/white-labels) da plataforma Vello Finance.

CREATE TYPE tenant_type AS ENUM ('whitelabel', 'subscription');
CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'cancelled');

CREATE TABLE tenants (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id        UUID NOT NULL REFERENCES plans(id),
  type           tenant_type NOT NULL,
  name           TEXT NOT NULL,
  company_name   TEXT NOT NULL,
  cnpj           TEXT NOT NULL UNIQUE,
  email          TEXT NOT NULL,
  phone          TEXT,
  slug           TEXT NOT NULL UNIQUE,
  custom_domain  TEXT UNIQUE,
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

-- RLS: Categoria A — tabela do backoffice (sem acesso de tenant)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenants
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

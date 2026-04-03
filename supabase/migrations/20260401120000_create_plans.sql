-- Migration: create_plans
-- Tabela de planos comerciais da plataforma Vello Finance.
-- Define os planos disponíveis para contratação por tenants (signature ou white_label),
-- com controle de comissão, mensalidade, setup fee e features habilitadas.
-- RLS Categoria A: acesso total ao backoffice; tenants podem apenas ler planos ativos.

CREATE TABLE plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL UNIQUE,
  type            TEXT NOT NULL CHECK (type IN ('signature', 'white_label')),
  monthly_fee     NUMERIC(10,2),
  setup_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_pct  NUMERIC(5,4) NOT NULL,
  max_products    INT,
  features        JSONB NOT NULL DEFAULT '[]',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_plans
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON plans
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_read_active" ON plans
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );

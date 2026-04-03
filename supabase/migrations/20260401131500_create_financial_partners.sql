-- Migration: create_financial_partners
-- RLS: Categoria A — tabela do backoffice (sem acesso de tenant)

CREATE TABLE financial_partners (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('qi_tech', 'bancly', 'zip', 'other')),
  api_base_url    TEXT,
  api_key_enc     TEXT,
  webhook_secret  TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_financial_partners
  BEFORE UPDATE ON financial_partners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE financial_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON financial_partners
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

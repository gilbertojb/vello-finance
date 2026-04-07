-- Migration: create_financial_partners
-- Instituições financeiras parceiras (IFs) que oferecem produtos de crédito.
-- Credenciais de API são armazenadas criptografadas (api_key_enc).
-- RLS: Categoria A — apenas backoffice acessa.

CREATE TABLE financial_partners (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  api_base_url   TEXT,
  api_key_enc    TEXT,          -- Criptografado — nunca expor ao cliente
  webhook_secret TEXT,          -- Para validar webhooks recebidos
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_financial_partners
  BEFORE UPDATE ON financial_partners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE financial_partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON financial_partners
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

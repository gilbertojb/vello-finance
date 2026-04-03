-- Migration: create_products
-- RLS: Categoria C — backoffice gerencia, tenants leem apenas registros ativos

CREATE TABLE products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  financial_partner_id  UUID REFERENCES financial_partners(id),
  name                  TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN (
                          'fgts', 'consignado_publico', 'consignado_privado',
                          'home_equity', 'auto_equity', 'outros'
                        )),
  description           TEXT,
  min_amount            NUMERIC(12,2),
  max_amount            NUMERIC(12,2),
  min_term_months       INT,
  max_term_months       INT,
  min_rate_monthly      NUMERIC(6,4),
  max_rate_monthly      NUMERIC(6,4),
  bank_commission_pct   NUMERIC(5,4) NOT NULL,
  vello_commission_pct  NUMERIC(5,4) NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT commission_valid CHECK (vello_commission_pct <= bank_commission_pct)
);

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Backoffice gerencia tudo
CREATE POLICY "backoffice_full_access" ON products
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

-- Tenants leem apenas registros ativos
CREATE POLICY "tenant_read_active" ON products
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );

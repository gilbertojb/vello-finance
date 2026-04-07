-- Migration: create_products
-- Produtos de crédito disponíveis na plataforma.
-- Comissões são gerenciadas por par produto+IF em product_financial_partners (N:N).
-- RLS: Categoria C — backoffice gerencia; tenants leem apenas produtos ativos.

CREATE TABLE products (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,
  type                 TEXT NOT NULL CHECK (type IN (
                         'fgts', 'consignado_publico', 'consignado_privado',
                         'home_equity', 'auto_equity', 'outros'
                       )),
  description          TEXT,
  internal_description TEXT,          -- Visível apenas no backoffice
  min_amount           NUMERIC(12,2),
  max_amount           NUMERIC(12,2),
  min_term_months      INT,
  max_term_months      INT,
  min_rate_monthly     NUMERIC(6,2),  -- Taxa mínima mensal (%)
  max_rate_monthly     NUMERIC(6,2),  -- Taxa máxima mensal (%)
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON products
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_read_active" ON products
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );

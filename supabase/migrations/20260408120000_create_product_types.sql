-- Migration: create_product_types
-- Tipos de produto de crédito gerenciados pelo backoffice.
-- RLS: Categoria C — backoffice gerencia; tenants leem apenas tipos ativos.

CREATE TABLE product_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_product_types
  BEFORE UPDATE ON product_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE product_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON product_types
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_read_active" ON product_types
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );

-- Pre-popular com os tipos existentes (slugs espelham a CHECK constraint anterior)
INSERT INTO product_types (name, slug) VALUES
  ('FGTS',               'fgts'),
  ('Consignado Público',  'consignado_publico'),
  ('Consignado Privado',  'consignado_privado'),
  ('Home Equity',         'home_equity'),
  ('Auto Equity',         'auto_equity'),
  ('Outros',              'outros');

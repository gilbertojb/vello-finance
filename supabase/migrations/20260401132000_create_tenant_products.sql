-- Migration: create_tenant_products
-- Produtos habilitados por tenant com suas comissões individuais.
-- Depende das tabelas tenants e products.

CREATE TABLE tenant_products (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  tenant_commission_pct NUMERIC(5,4) NOT NULL,
  vello_spread_pct      NUMERIC(5,4) NOT NULL,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(tenant_id, product_id),
  CONSTRAINT tenant_commission_pct_valid CHECK (tenant_commission_pct >= 0 AND tenant_commission_pct <= 1),
  CONSTRAINT vello_spread_pct_valid CHECK (vello_spread_pct >= 0 AND vello_spread_pct <= 1)
);

CREATE TRIGGER set_updated_at_tenant_products
  BEFORE UPDATE ON tenant_products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Categoria B — isolada por tenant
ALTER TABLE tenant_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenant_products
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_isolation" ON tenant_products
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

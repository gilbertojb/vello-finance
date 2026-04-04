-- Migration: create_product_financial_partners
-- Relação N:N entre produtos e instituições financeiras.
-- Comissão negociada por par produto+IF (a mesma IF pode ter % diferentes por produto).
-- RLS: Categoria C — backoffice gerencia, tenants leem apenas registros ativos.

CREATE TABLE product_financial_partners (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  financial_partner_id UUID NOT NULL REFERENCES financial_partners(id) ON DELETE RESTRICT,
  if_commission_pct    NUMERIC(6,3) NOT NULL,  -- % que a IF paga à Vello (ex: 3.755)
  vello_commission_pct NUMERIC(6,3) NOT NULL,  -- % que a Vello retém
  -- Disponível ao tenant = if_commission_pct - vello_commission_pct
  is_active            BOOLEAN NOT NULL DEFAULT true,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(product_id, financial_partner_id),
  CONSTRAINT pfp_commission_valid CHECK (vello_commission_pct <= if_commission_pct),
  CONSTRAINT pfp_if_commission_positive CHECK (if_commission_pct > 0),
  CONSTRAINT pfp_vello_commission_non_negative CHECK (vello_commission_pct >= 0)
);

CREATE TRIGGER set_updated_at_product_financial_partners
  BEFORE UPDATE ON product_financial_partners
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE product_financial_partners ENABLE ROW LEVEL SECURITY;

-- Backoffice gerencia tudo
CREATE POLICY "backoffice_full_access" ON product_financial_partners
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

-- Tenants leem apenas registros ativos cujo produto também esteja ativo
CREATE POLICY "tenant_read_active" ON product_financial_partners
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM products p
      WHERE p.id = product_id AND p.is_active = true
    )
  );

-- Migration: create_proposal_stages
-- Etapas de pipeline por tipo de produto.
-- RLS: backoffice gerencia; tenants leem etapas de tipos ativos.

CREATE TABLE proposal_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_type_id UUID NOT NULL REFERENCES product_types(id) ON DELETE CASCADE,
  name            VARCHAR(100) NOT NULL,
  order_num       INTEGER NOT NULL,
  timeout_unit    VARCHAR(10) CHECK (timeout_unit IN ('minutes', 'hours', 'days')),
  timeout_value   INTEGER CHECK (timeout_value IS NULL OR timeout_value > 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_type_id, order_num)
);

CREATE TRIGGER set_updated_at_proposal_stages
  BEFORE UPDATE ON proposal_stages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_proposal_stages_product_order
  ON proposal_stages(product_type_id, order_num);

-- RLS
ALTER TABLE proposal_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON proposal_stages
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_read_active_pipeline" ON proposal_stages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM product_types pt
      WHERE pt.id = product_type_id
        AND pt.is_active = true
    )
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
  );

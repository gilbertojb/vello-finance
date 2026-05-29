-- supabase/migrations/20260528130000_create_commission_snapshots.sql

CREATE TABLE commission_snapshots (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id               UUID NOT NULL REFERENCES proposals(id),
  product_id                UUID NOT NULL REFERENCES products(id),
  tenant_id                 UUID NOT NULL REFERENCES tenants(id),
  financial_partner_id      UUID REFERENCES financial_partners(id),
  if_commission_pct         NUMERIC(6,3) NOT NULL DEFAULT 0,
  vello_commission_pct      NUMERIC(6,3) NOT NULL DEFAULT 0,
  tenant_commission_pct     NUMERIC(6,3) NOT NULL DEFAULT 0,
  vello_spread_pct          NUMERIC(6,3) NOT NULL DEFAULT 0,
  loan_amount               NUMERIC(12,2),
  if_commission_amount      NUMERIC(10,2),
  vello_commission_amount   NUMERIC(10,2),
  tenant_commission_amount  NUMERIC(10,2),
  paid_at                   TIMESTAMPTZ,
  captured_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE commission_snapshots ENABLE ROW LEVEL SECURITY;

-- Backoffice can do everything (including marking paid_at)
CREATE POLICY "backoffice_full_access" ON commission_snapshots
  FOR ALL
  USING ((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin', 'financial', 'support'));

-- Tenant can only read their own snapshots
CREATE POLICY "tenant_read_own" ON commission_snapshots
  FOR SELECT
  USING (
    (auth.jwt() ->> 'user_role') IN ('tenant_admin', 'tenant_operator')
    AND tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Trigger to auto-capture snapshot on proposal INSERT
CREATE OR REPLACE FUNCTION capture_commission_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_product tenant_products%ROWTYPE;
BEGIN
  SELECT * INTO v_tenant_product FROM tenant_products
    WHERE tenant_id = NEW.tenant_id
      AND product_id = NEW.product_id
      AND is_active = true;

  IF FOUND THEN
    INSERT INTO commission_snapshots (
      proposal_id, product_id, tenant_id,
      tenant_commission_pct
    ) VALUES (
      NEW.id, NEW.product_id, NEW.tenant_id,
      COALESCE(v_tenant_product.tenant_commission_pct, 0)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_capture_commission_snapshot
  AFTER INSERT ON proposals
  FOR EACH ROW EXECUTE FUNCTION capture_commission_snapshot();

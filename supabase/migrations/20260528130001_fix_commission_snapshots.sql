-- supabase/migrations/20260528130001_fix_commission_snapshots.sql
-- Corrige três issues encontrados em code review:
--   1. Trigger sempre insere snapshot (mesmo sem tenant_product configurado)
--   2. SECURITY DEFINER com SET search_path para evitar search_path injection
--   3. WITH CHECK adicionado na policy backoffice_full_access
--   4. Indexes em tenant_id e proposal_id

-- 1. Corrige função: sempre insere, adiciona SET search_path
CREATE OR REPLACE FUNCTION capture_commission_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_product tenant_products%ROWTYPE;
BEGIN
  SELECT * INTO v_tenant_product FROM tenant_products
    WHERE tenant_id = NEW.tenant_id
      AND product_id = NEW.product_id
      AND is_active = true;

  INSERT INTO commission_snapshots (
    proposal_id, product_id, tenant_id,
    tenant_commission_pct
  ) VALUES (
    NEW.id, NEW.product_id, NEW.tenant_id,
    COALESCE(v_tenant_product.tenant_commission_pct, 0)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

-- 2. Recria policy backoffice_full_access com WITH CHECK
--    (Postgres não tem CREATE OR REPLACE POLICY)
DROP POLICY IF EXISTS "backoffice_full_access" ON commission_snapshots;

CREATE POLICY "backoffice_full_access" ON commission_snapshots
  FOR ALL
  USING ((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin', 'financial', 'support'))
  WITH CHECK ((auth.jwt() ->> 'user_role') IN ('super_admin', 'admin', 'financial', 'support'));

-- 3. Indexes para queries frequentes
CREATE INDEX ON commission_snapshots (tenant_id);
CREATE INDEX ON commission_snapshots (proposal_id);

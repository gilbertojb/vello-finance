-- Migration: add_tenant_user_read_policy
-- Permite que tenant users leiam o registro do próprio tenant.
-- Usa tenant_id do JWT claims para garantir isolamento.

CREATE POLICY "tenant_user_read_own" ON tenants
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') IN ('tenant_admin', 'tenant_operator')
    AND id = (auth.jwt() ->> 'tenant_id')::uuid
  );

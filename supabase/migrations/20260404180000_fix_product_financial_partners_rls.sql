-- Fix RLS policies on product_financial_partners to use 'user_role' claim
-- (not 'role') — consistent with all other tables in this project.
-- See migration 20260403163300_update_rls_policies_user_role.sql for context.
--
-- RULE: Always use auth.jwt() ->> 'user_role' (never 'role') in RLS policies.
-- The 'user_role' claim is injected by the custom access token hook (postgres_custom_access_token_hook).

DROP POLICY IF EXISTS "backoffice_full_access" ON product_financial_partners;
DROP POLICY IF EXISTS "tenant_read_active" ON product_financial_partners;

CREATE POLICY "backoffice_full_access" ON product_financial_partners
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_read_active" ON product_financial_partners
  FOR SELECT USING (
    is_active = true
    AND (auth.jwt() ->> 'tenant_id') IS NOT NULL
    AND EXISTS (SELECT 1 FROM products p WHERE p.id = product_id AND p.is_active = true)
  );

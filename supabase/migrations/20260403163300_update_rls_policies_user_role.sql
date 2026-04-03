-- Migration: update_rls_policies_user_role
-- Descrição: Substitui referências de auth.jwt()->>'role' por auth.jwt()->>'user_role' para evitar conflitos com database roles do Supabase

-- Tabela: tenants
DROP POLICY IF EXISTS "backoffice_full_access" ON tenants;
CREATE POLICY "backoffice_full_access" ON tenants FOR ALL USING (
  (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
);

-- Tabela: tenant_branding
DROP POLICY IF EXISTS "backoffice_full_access" ON tenant_branding;
CREATE POLICY "backoffice_full_access" ON tenant_branding FOR ALL USING (
  (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
);

-- Tabela: plans
DROP POLICY IF EXISTS "backoffice_full_access" ON plans;
CREATE POLICY "backoffice_full_access" ON plans FOR ALL USING (
  (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
);

-- Tabela: financial_partners
DROP POLICY IF EXISTS "backoffice_full_access" ON financial_partners;
CREATE POLICY "backoffice_full_access" ON financial_partners FOR ALL USING (
  (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
);

-- Tabela: products
DROP POLICY IF EXISTS "backoffice_full_access" ON products;
CREATE POLICY "backoffice_full_access" ON products FOR ALL USING (
  (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
);

-- Tabela: tenant_products
DROP POLICY IF EXISTS "backoffice_full_access" ON tenant_products;
CREATE POLICY "backoffice_full_access" ON tenant_products FOR ALL USING (
  (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
);

-- Tabela: backoffice_users
DROP POLICY IF EXISTS "backoffice_users_super_admin" ON backoffice_users;
DROP POLICY IF EXISTS "backoffice_users_admin_all" ON backoffice_users;
DROP POLICY IF EXISTS "backoffice_users_self_update" ON backoffice_users;

CREATE POLICY "backoffice_users_super_admin" ON backoffice_users
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = 'super_admin'
  );

CREATE POLICY "backoffice_users_admin_all" ON backoffice_users
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "backoffice_users_self_update" ON backoffice_users
  FOR UPDATE USING (
    id = auth.uid()
  ) WITH CHECK (
    id = auth.uid() 
    AND (auth.jwt() ->> 'user_role') = 'super_admin'
  );

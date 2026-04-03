-- Migration: fix_backoffice_users_rls
-- Ajusta as policies de RLS de backoffice_users para seguir o padrão do projeto:
-- - Todos os roles do backoffice podem ler (necessário para listagem de membros da equipe)
-- - Apenas super_admin pode criar, editar e remover membros

-- Remove policies antigas
DROP POLICY IF EXISTS "backoffice_users_self_read" ON backoffice_users;
DROP POLICY IF EXISTS "backoffice_users_super_admin" ON backoffice_users;

-- Todos os roles do backoffice podem ler
CREATE POLICY "backoffice_full_read" ON backoffice_users
  FOR SELECT USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Apenas super_admin pode criar, editar e remover membros
CREATE POLICY "super_admin_write" ON backoffice_users
  FOR ALL
  USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'role') = 'super_admin'
  );

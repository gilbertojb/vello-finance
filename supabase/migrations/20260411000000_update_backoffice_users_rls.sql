-- Permitir que 'admin' (além de 'super_admin') gerencie backoffice_users.
-- Restrições de delete (super_admin only) e anti-self são enforced na application layer (CASL).

DROP POLICY "super_admin_write" ON backoffice_users;

CREATE POLICY "admin_write" ON backoffice_users
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin')
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin')
  );

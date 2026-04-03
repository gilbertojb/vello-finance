-- Migration: create_backoffice_users
-- Tabela de usuários do backoffice (Vello Admin).
-- Referencia auth.users — cada registro representa um membro da equipe interna.

CREATE TYPE backoffice_role AS ENUM (
  'super_admin',
  'admin',
  'financial',
  'support'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE backoffice_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       backoffice_role NOT NULL DEFAULT 'support',
  full_name  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_backoffice_users
  BEFORE UPDATE ON backoffice_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: cada usuário lê apenas o próprio perfil;
-- super_admin gerencia todos os registros.
ALTER TABLE backoffice_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_users_self_read" ON backoffice_users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "backoffice_users_super_admin" ON backoffice_users
  FOR ALL USING (
    (auth.jwt() ->> 'role') = 'super_admin'
  );

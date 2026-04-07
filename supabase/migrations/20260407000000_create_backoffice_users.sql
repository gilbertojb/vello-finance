-- Migration: create_backoffice_users
-- Usuários internos da equipe Vello Finance com acesso ao backoffice (apps/admin).
-- RLS: todos os roles podem ler; apenas super_admin pode escrever.

-- Função compartilhada: atualiza updated_at automaticamente em qualquer tabela
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ENUM: roles do backoffice
CREATE TYPE backoffice_role AS ENUM ('super_admin', 'admin', 'financial', 'support');

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

-- RLS
ALTER TABLE backoffice_users ENABLE ROW LEVEL SECURITY;

-- Todos os roles do backoffice podem ler membros da equipe
CREATE POLICY "backoffice_full_read" ON backoffice_users
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

-- Apenas super_admin pode criar, editar e remover membros
CREATE POLICY "super_admin_write" ON backoffice_users
  FOR ALL
  USING (
    (auth.jwt() ->> 'user_role') = 'super_admin'
  )
  WITH CHECK (
    (auth.jwt() ->> 'user_role') = 'super_admin'
  );

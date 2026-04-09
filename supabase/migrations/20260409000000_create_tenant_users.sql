-- supabase/migrations/20260409000000_create_tenant_users.sql
-- Tabela de usuários do console (tenants).
-- Referenciada pelo auth hook (create_auth_hook.sql) — deve existir antes de ativar tenants.

CREATE TYPE tenant_role AS ENUM ('tenant_admin', 'tenant_operator');

CREATE TABLE tenant_users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id  UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role       tenant_role NOT NULL DEFAULT 'tenant_admin',
  full_name  TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_tenant_users
  BEFORE UPDATE ON tenant_users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;

-- Backoffice gerencia todos os tenant_users (necessário para F3 — Ativar Tenant)
CREATE POLICY "backoffice_full_access" ON tenant_users
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

-- Esta policy cobre o role tenant_operator (leitura dos membros do próprio tenant).
-- O tenant_admin já possui acesso SELECT via tenant_admin_write (FOR ALL);
-- a sobreposição em SELECT é intencional — simplifica o modelo sem efeito colateral.
CREATE POLICY "tenant_read" ON tenant_users
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- FOR ALL inclui DELETE intencionalmente: no MVP, o tenant_admin pode excluir membros
-- de forma permanente (hard-delete). O padrão de soft-delete via is_active=false é o
-- comportamento esperado para tenant_operator, mas o admin tem autonomia de hard-delete.
-- Apenas tenant_admin pode gerenciar usuários do seu tenant
CREATE POLICY "tenant_admin_write" ON tenant_users
  FOR ALL
  USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') = 'tenant_admin'
  )
  WITH CHECK (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    AND (auth.jwt() ->> 'user_role') = 'tenant_admin'
  );

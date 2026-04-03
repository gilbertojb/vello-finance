-- Migration: create_tenant_branding
-- Identidade visual de cada tenant. Criada automaticamente via trigger ao inserir um tenant.

CREATE TABLE tenant_branding (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url             TEXT,
  favicon_url          TEXT,
  primary_color        TEXT NOT NULL DEFAULT '#3B5BBE',
  secondary_color      TEXT NOT NULL DEFAULT '#1E3A5F',
  auth_bg_image_url    TEXT,
  auth_bg_color        TEXT NOT NULL DEFAULT '#18181b',
  auth_theme           TEXT NOT NULL DEFAULT 'dark'
                       CHECK (auth_theme IN ('dark', 'light')),
  company_display_name TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cria registro de branding padrão automaticamente ao inserir um tenant
CREATE OR REPLACE FUNCTION create_default_branding()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_branding (tenant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_branding
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_branding();

CREATE TRIGGER set_updated_at_tenant_branding
  BEFORE UPDATE ON tenant_branding
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS: Categoria B — isolada por tenant
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenant_branding
  FOR ALL USING (
    (auth.jwt() ->> 'role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_isolation" ON tenant_branding
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

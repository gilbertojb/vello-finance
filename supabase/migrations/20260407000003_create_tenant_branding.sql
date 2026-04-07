-- Migration: create_tenant_branding
-- Identidade visual de cada tenant para o white-label.
-- Criada automaticamente com valores padrão via trigger ao inserir um tenant.
-- custom_css: JSONB com tokens CSS semânticos e CSS livre.
--   Estrutura: { "background": "oklch(...)", "primary": "oklch(...)", ..., "rawCss": "..." }
-- RLS: Categoria B — isolada por tenant; backoffice acessa tudo.

CREATE TABLE tenant_branding (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  logo_url             TEXT,
  favicon_url          TEXT,
  auth_bg_image_url    TEXT,
  company_display_name TEXT,
  use_custom_theme     BOOLEAN NOT NULL DEFAULT false,
  base_color           TEXT,
  theme_color          TEXT,
  custom_css           JSONB,
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

-- RLS
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenant_branding
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_isolation" ON tenant_branding
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- Migration: create_tenant_theme_tokens
-- Armazena tokens CSS semânticos gerados/editados por tenant.

CREATE TABLE tenant_theme_tokens (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,

  -- Tokens de cor (valores CSS: oklch(...), hsl(...) ou qualquer CSS color)
  background             TEXT,
  foreground             TEXT,
  card                   TEXT,
  card_foreground        TEXT,
  popover                TEXT,
  popover_foreground     TEXT,
  primary_token          TEXT,   -- "primary" é palavra reservada em SQL
  primary_foreground     TEXT,
  secondary_token        TEXT,
  secondary_foreground   TEXT,
  muted                  TEXT,
  muted_foreground       TEXT,
  accent                 TEXT,
  accent_foreground      TEXT,
  destructive            TEXT,
  destructive_foreground TEXT,
  border_token           TEXT,   -- "border" é palavra reservada em SQL
  input_token            TEXT,
  ring_token             TEXT,
  radius_token           TEXT,   -- ex: "0.5rem"

  -- Tokens de chart
  chart_1                TEXT,
  chart_2                TEXT,
  chart_3                TEXT,
  chart_4                TEXT,
  chart_5                TEXT,

  -- Tokens de sidebar
  sidebar_background     TEXT,
  sidebar_foreground     TEXT,
  sidebar_primary        TEXT,
  sidebar_primary_foreground TEXT,
  sidebar_accent         TEXT,
  sidebar_accent_foreground  TEXT,
  sidebar_border         TEXT,
  sidebar_ring           TEXT,

  -- Tipografia opcional
  font_sans              TEXT,
  font_heading           TEXT,

  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-atualizar updated_at
CREATE TRIGGER set_updated_at_tenant_theme_tokens
  BEFORE UPDATE ON tenant_theme_tokens
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Criar tokens padrão automaticamente ao inserir tenant
CREATE OR REPLACE FUNCTION create_default_theme_tokens()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO tenant_theme_tokens (tenant_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_create_default_theme_tokens
  AFTER INSERT ON tenants
  FOR EACH ROW EXECUTE FUNCTION create_default_theme_tokens();

-- RLS
ALTER TABLE tenant_theme_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON tenant_theme_tokens
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_read_own" ON tenant_theme_tokens
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

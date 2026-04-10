-- Migration: custom_css_to_text
-- Altera custom_css de JSONB para TEXT (CSS puro injetado direto como <style>).

ALTER TABLE tenant_branding
  ALTER COLUMN custom_css TYPE TEXT USING custom_css::TEXT;

COMMENT ON COLUMN tenant_branding.custom_css IS 'CSS puro (variáveis + regras) injetado como <style> no console. Usar seletor [data-tenant-theme="slug"] para escopo.';

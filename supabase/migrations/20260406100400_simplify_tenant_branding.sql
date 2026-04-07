-- Migration: simplify_tenant_branding
-- Remove campos legados de cor, tabela tenant_theme_tokens e converte
-- custom_css TEXT → JSONB para armazenar tokens e CSS customizado em uma única coluna.
--
-- Estrutura do JSONB em custom_css:
-- {
--   "background": "oklch(...)",   ← tokens CSS semânticos (chaves = CSS variable names)
--   "primary":    "oklch(...)",
--   ...
--   "rawCss":     "..."           ← CSS customizado livre (textarea do admin)
-- }

-- 1. Remover campos legados de identidade visual
ALTER TABLE tenant_branding
  DROP COLUMN IF EXISTS primary_color,
  DROP COLUMN IF EXISTS secondary_color,
  DROP COLUMN IF EXISTS auth_theme,
  DROP COLUMN IF EXISTS auth_bg_color;

-- 2. Converter custom_css de TEXT para JSONB
--    USING NULL: descarta qualquer valor texto existente (seguro em desenvolvimento)
ALTER TABLE tenant_branding
  ALTER COLUMN custom_css TYPE JSONB USING NULL;

-- 3. Remover tabela de tokens separada (consolidada em tenant_branding.custom_css)
DROP TABLE IF EXISTS tenant_theme_tokens CASCADE;

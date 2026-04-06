-- Migration: alter_tenant_branding_add_theme_fields
-- Adiciona suporte a tema dinâmico white-label por tenant.

ALTER TABLE tenant_branding
  ADD COLUMN IF NOT EXISTS use_custom_theme BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS base_color       TEXT,
  ADD COLUMN IF NOT EXISTS theme_color      TEXT,
  ADD COLUMN IF NOT EXISTS custom_css       TEXT;

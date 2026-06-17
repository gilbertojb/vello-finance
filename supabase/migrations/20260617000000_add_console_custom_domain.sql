-- Migration: add_console_custom_domain
-- Adiciona coluna para domínio personalizado do console (separado do custom_domain da store).

ALTER TABLE tenants ADD COLUMN console_custom_domain TEXT UNIQUE;

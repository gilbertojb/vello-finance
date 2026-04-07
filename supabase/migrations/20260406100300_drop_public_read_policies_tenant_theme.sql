-- Migration: drop_public_read_policies_tenant_theme
-- Remove permissões públicas de leitura. O endpoint /api/tenant-theme
-- usa o service role server-side — não é necessário expor as tabelas ao anon.

DROP POLICY IF EXISTS "public_read_slug" ON tenants;
DROP POLICY IF EXISTS "public_read_theme" ON tenant_branding;
DROP POLICY IF EXISTS "public_read_tokens" ON tenant_theme_tokens;

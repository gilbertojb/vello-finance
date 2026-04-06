-- Migration: add_public_read_policies_tenant_theme
-- Permite leitura pública (sem autenticação) dos dados de identidade visual dos tenants.
-- Necessário para o endpoint GET /api/tenant-theme do console, que é chamado sem sessão autenticada.
-- Apenas campos não sensíveis são expostos — slug, campos de tema e tokens CSS.

-- Leitura pública de tenants apenas para lookup por slug (id + slug)
CREATE POLICY "public_read_slug" ON tenants
  FOR SELECT USING (true);

-- Leitura pública de tenant_branding (campos de tema)
CREATE POLICY "public_read_theme" ON tenant_branding
  FOR SELECT USING (true);

-- Leitura pública de tenant_theme_tokens (tokens CSS)
CREATE POLICY "public_read_tokens" ON tenant_theme_tokens
  FOR SELECT USING (true);

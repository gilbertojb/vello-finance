-- Adiciona suporte ao sistema de templates white-label na store.
-- O template_id aponta para um template de código (ex: 'zp', 'default').
-- NULL = usa o template default da Vello.
-- Definido pela equipe Vello via SQL ao ativar um white-label — sem UI de edição por enquanto.

ALTER TABLE tenant_branding
  ADD COLUMN IF NOT EXISTS template_id TEXT;

COMMENT ON COLUMN tenant_branding.template_id IS
  'Slug do template white-label registrado no código da store (ex: ''zp''). NULL = template default Vello.';

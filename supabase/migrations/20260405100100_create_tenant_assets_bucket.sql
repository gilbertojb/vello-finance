-- Cria bucket público para assets de tenants (logo, favicon, imagem de fundo auth).
-- Leitura irrestrita (público). Escrita restrita ao backoffice via RLS.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon']
);

-- Apenas backoffice pode inserir objetos
CREATE POLICY "tenant_assets_backoffice_insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'tenant-assets'
  AND (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin', 'financial', 'support')
);

-- Apenas backoffice pode atualizar objetos
CREATE POLICY "tenant_assets_backoffice_update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'tenant-assets'
  AND (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin', 'financial', 'support')
);

-- Apenas backoffice pode deletar objetos
CREATE POLICY "tenant_assets_backoffice_delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'tenant-assets'
  AND (auth.jwt() ->> 'user_role') IN ('super_admin', 'admin', 'financial', 'support')
);

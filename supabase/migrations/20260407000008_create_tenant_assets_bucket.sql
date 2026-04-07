-- Migration: create_tenant_assets_bucket
-- Bucket público para assets de tenants: logo, favicon e imagem de fundo da tela de auth.
-- Leitura pública irrestrita. Escrita restrita ao backoffice via RLS.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon']
);

CREATE POLICY "tenant_assets_backoffice_insert" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'tenant-assets'
    AND (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_assets_backoffice_update" ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'tenant-assets'
    AND (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

CREATE POLICY "tenant_assets_backoffice_delete" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'tenant-assets'
    AND (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin', 'admin', 'financial', 'support'])
  );

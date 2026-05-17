-- ============================================================
-- proposals (recria tabela com schema atualizado para contracting flows)
-- ============================================================
DROP TABLE IF EXISTS proposals CASCADE;

CREATE TABLE proposals (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  product_type_slug   TEXT NOT NULL,
  simulation_id       UUID REFERENCES simulations(id),
  status              TEXT NOT NULL DEFAULT 'nova_proposta'
    CHECK (status IN (
      'nova_proposta',
      'proposta_criada',
      'em_analise',
      'pre_aprovada',
      'necessita_detalhes',
      'reprovada',
      'aprovada'
    )),
  current_step        TEXT NOT NULL DEFAULT 'operacao',
  client_name         TEXT,
  client_phone        TEXT,
  form_data           JSONB NOT NULL DEFAULT '{}',
  documents_submitted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_service_role" ON proposals
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "proposals_tenant_select" ON proposals
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- ============================================================
-- proposal_documents
-- ============================================================
CREATE TABLE proposal_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  file_name       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT proposal_documents_unique_type UNIQUE (proposal_id, document_type)
);

ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_documents_service_role" ON proposal_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "proposal_documents_tenant_select" ON proposal_documents
  FOR SELECT USING (
    proposal_id IN (
      SELECT id FROM proposals
      WHERE tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
    )
  );

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Storage bucket (privado) para documentos de propostas
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-documents', 'proposal-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "proposal_documents_upload"
  ON storage.objects FOR INSERT TO service_role
  WITH CHECK (bucket_id = 'proposal-documents');

CREATE POLICY "proposal_documents_read"
  ON storage.objects FOR SELECT TO service_role
  USING (bucket_id = 'proposal-documents');

CREATE POLICY "proposal_documents_delete"
  ON storage.objects FOR DELETE TO service_role
  USING (bucket_id = 'proposal-documents');

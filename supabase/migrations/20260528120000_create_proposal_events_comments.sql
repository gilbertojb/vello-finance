-- supabase/migrations/20260528120000_create_proposal_events_comments.sql

-- ============================================================
-- proposal_events — log append-only de transições de status
-- ============================================================
CREATE TABLE proposal_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  from_status TEXT,
  to_status   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_events_proposal
  ON proposal_events(proposal_id, created_at ASC);

ALTER TABLE proposal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_events_service_role" ON proposal_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "proposal_events_tenant_select" ON proposal_events
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

CREATE POLICY "proposal_events_backoffice_select" ON proposal_events
  FOR SELECT USING (
    (auth.jwt() ->> 'user_role') = ANY(
      ARRAY['super_admin','admin','financial','support']
    )
  );

-- ============================================================
-- proposal_comments — comentários do time operacional
-- ============================================================
CREATE TABLE proposal_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  author_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposal_comments_proposal
  ON proposal_comments(proposal_id, created_at ASC);

ALTER TABLE proposal_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_comments_service_role" ON proposal_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "proposal_comments_tenant_select" ON proposal_comments
  FOR SELECT USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

-- ============================================================
-- Seed: backfill proposal_events para propostas existentes
-- Cria um evento "nova_proposta" para cada proposta que
-- ainda não tem nenhum evento registrado.
-- ============================================================
INSERT INTO proposal_events (proposal_id, tenant_id, from_status, to_status, created_at)
SELECT
  p.id,
  p.tenant_id,
  NULL,
  'nova_proposta',
  p.created_at
FROM proposals p
WHERE NOT EXISTS (
  SELECT 1 FROM proposal_events e WHERE e.proposal_id = p.id
);

-- Seed: backfill evento "em_analise" para propostas que já estão nesse status
INSERT INTO proposal_events (proposal_id, tenant_id, from_status, to_status, created_at)
SELECT
  p.id,
  p.tenant_id,
  'nova_proposta',
  p.status,
  GREATEST(p.updated_at, p.created_at)
FROM proposals p
WHERE p.status IN ('em_analise','pre_aprovada','necessita_detalhes','reprovada','aprovada')
  AND NOT EXISTS (
    SELECT 1 FROM proposal_events e
    WHERE e.proposal_id = p.id AND e.to_status = p.status
  );

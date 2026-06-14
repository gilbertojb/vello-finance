-- ============================================================
-- Portal de documentos do cliente — coluna de hash + tabelas auxiliares
-- ============================================================

-- 1. Hash de CPF para lookup seguro
ALTER TABLE proposals
  ADD COLUMN client_cpf_hash TEXT;

CREATE INDEX idx_proposals_tenant_cpf_hash
  ON proposals(tenant_id, client_cpf_hash)
  WHERE client_cpf_hash IS NOT NULL;

-- 2. Tabela de tentativas (rate limit)
CREATE TABLE client_access_attempts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id),
  ip_hash       TEXT NOT NULL,
  cpf_hash      TEXT,
  success       BOOLEAN NOT NULL DEFAULT FALSE,
  attempted_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attempts_ip_recent
  ON client_access_attempts(ip_hash, attempted_at DESC);

CREATE INDEX idx_attempts_cpf_recent
  ON client_access_attempts(cpf_hash, attempted_at DESC)
  WHERE cpf_hash IS NOT NULL;

ALTER TABLE client_access_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_attempts_service_role" ON client_access_attempts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Tabela de auditoria de acesso a documentos
CREATE TABLE proposal_document_access_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id),
  proposal_id     UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  action          TEXT NOT NULL CHECK (action IN ('viewed_list','viewed_proposal','uploaded','downloaded')),
  document_type   TEXT,
  ip_hash         TEXT NOT NULL,
  user_agent_hash TEXT,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_access_log_proposal ON proposal_document_access_log(proposal_id, occurred_at DESC);
CREATE INDEX idx_access_log_tenant ON proposal_document_access_log(tenant_id, occurred_at DESC);

ALTER TABLE proposal_document_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "access_log_service_role" ON proposal_document_access_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "access_log_tenant_select" ON proposal_document_access_log
  FOR SELECT USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

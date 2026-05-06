CREATE TABLE proposals (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            UUID NOT NULL REFERENCES tenants(id),
  product_id           UUID NOT NULL REFERENCES products(id),

  -- Status e pipeline
  status               TEXT NOT NULL DEFAULT 'simulation'
                       CHECK (status IN (
                         'simulation',
                         'in_pipeline',
                         'approved',
                         'rejected',
                         'cancelled'
                       )),
  stage_id             UUID REFERENCES proposal_stages(id),

  -- Dados da simulação
  purpose              TEXT CHECK (purpose IN (
                         'pessoal','empresa','imovel','veiculo','outro'
                       )),
  desired_amount       NUMERIC(12,2) NOT NULL,
  desired_term_months  INT NOT NULL,
  estimated_rate       NUMERIC(6,4),
  estimated_payment    NUMERIC(12,2),

  -- Dados do cliente
  client_name          TEXT NOT NULL,
  client_email         TEXT NOT NULL,
  client_cpf           TEXT NOT NULL,
  client_phone         TEXT NOT NULL,
  client_birthdate     DATE NOT NULL,
  client_address       JSONB NOT NULL,

  -- Timestamps
  submitted_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at          TIMESTAMPTZ,
  rejected_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_proposals
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_proposals_tenant_status ON proposals(tenant_id, status);
CREATE INDEX idx_proposals_tenant_created ON proposals(tenant_id, created_at DESC);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backoffice_full_access" ON proposals
  FOR ALL USING (
    (auth.jwt() ->> 'user_role') = ANY(ARRAY['super_admin','admin','financial','support'])
  );

CREATE POLICY "tenant_isolation" ON proposals
  FOR ALL USING (
    tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  );

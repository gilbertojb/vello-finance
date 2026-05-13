CREATE TABLE simulations (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID NOT NULL REFERENCES tenants(id),
  product_id          UUID NOT NULL REFERENCES products(id),
  client_name         TEXT NOT NULL,
  client_phone        TEXT NOT NULL,
  desired_amount      NUMERIC(12,2) NOT NULL,
  desired_term_months INT NOT NULL,
  estimated_rate      NUMERIC(6,4),
  estimated_payment   NUMERIC(12,2),
  simulation_data     JSONB,
  status              TEXT NOT NULL DEFAULT 'rascunho'
                      CHECK (status IN ('rascunho','pre_qualificado')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_updated_at_simulations
  BEFORE UPDATE ON simulations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_simulations_tenant_status ON simulations(tenant_id, status);
CREATE INDEX idx_simulations_tenant_created ON simulations(tenant_id, created_at DESC);

ALTER TABLE simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON simulations FOR ALL
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "backoffice_full_access" ON simulations FOR ALL
  USING ((auth.jwt() ->> 'user_role') = ANY(
    ARRAY['super_admin','admin','financial','support']
  ));

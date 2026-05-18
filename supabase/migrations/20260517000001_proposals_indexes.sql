-- Indexes for proposals table
CREATE INDEX IF NOT EXISTS idx_proposals_tenant_id ON proposals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_proposals_tenant_status ON proposals(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_proposals_product_id ON proposals(product_id);
CREATE INDEX IF NOT EXISTS idx_proposals_simulation_id ON proposals(simulation_id);

-- Indexes for proposal_documents table
CREATE INDEX IF NOT EXISTS idx_proposal_documents_proposal_id ON proposal_documents(proposal_id);

-- Fix trigger idempotency
DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
  BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

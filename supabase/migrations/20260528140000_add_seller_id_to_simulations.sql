-- supabase/migrations/20260528140000_add_seller_id_to_simulations.sql
-- NULL = simulação direta (loja própria), UUID = vendedor cadastrado

ALTER TABLE simulations
  ADD COLUMN IF NOT EXISTS seller_id UUID REFERENCES tenant_users(id) ON DELETE SET NULL;

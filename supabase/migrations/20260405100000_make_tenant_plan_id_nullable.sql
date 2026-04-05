-- Torna plan_id nullable em tenants.
-- Associação de plano será feita no módulo de assinaturas.
ALTER TABLE tenants ALTER COLUMN plan_id DROP NOT NULL;

-- Torna cnpj nullable em tenants.
-- CNPJ pode ser preenchido após o cadastro inicial.
ALTER TABLE tenants ALTER COLUMN cnpj DROP NOT NULL;

-- Torna company_name nullable em tenants.
-- Razão social pode ser preenchida após o cadastro inicial.
ALTER TABLE tenants ALTER COLUMN company_name DROP NOT NULL;

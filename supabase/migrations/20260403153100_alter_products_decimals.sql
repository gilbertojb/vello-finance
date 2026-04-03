-- Migration: alter_products_decimals
-- Descrição: Ajusta os campos de percentual para duas casas decimais

ALTER TABLE products
  ALTER COLUMN bank_commission_pct TYPE numeric(6,2),
  ALTER COLUMN vello_commission_pct TYPE numeric(6,2),
  ALTER COLUMN min_rate_monthly TYPE numeric(6,2),
  ALTER COLUMN max_rate_monthly TYPE numeric(6,2);

-- Migration: alter_products_remove_commission_columns
-- Remove a relação 1:1 com financial_partners e as colunas de comissão,
-- agora gerenciadas por product_financial_partners.

ALTER TABLE products
  DROP COLUMN IF EXISTS financial_partner_id,
  DROP COLUMN IF EXISTS bank_commission_pct,
  DROP COLUMN IF EXISTS vello_commission_pct;

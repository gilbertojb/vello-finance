-- Migration: alter_financial_partners_remove_type_column
-- Remove a coluna type da tabela financial_partners.

ALTER TABLE financial_partners
  DROP COLUMN IF EXISTS type;

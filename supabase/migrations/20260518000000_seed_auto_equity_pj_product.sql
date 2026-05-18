-- Migration: seed_auto_equity_pj_product
-- Adiciona o produto "Empréstimo com Veículo em Garantia" para PJ,
-- que estava ausente no seed original (20260515120000_seed_products.sql).

INSERT INTO products (name, description, product_type_id, category, min_rate_monthly)
SELECT
  'Empréstimo com Veículo em Garantia',
  'Crédito PJ com garantia de veículo quitado, com limite de até 90% do valor do bem.',
  pt.id,
  'pessoa_juridica',
  1.49
FROM product_types pt WHERE pt.slug = 'auto_equity_pj';

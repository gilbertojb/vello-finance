-- Migration: seed_commissions_and_cleanup
-- 1. Limpa simulações de desenvolvimento
-- 2. Remove produto "Empréstimo FGTS" (nome legado)
-- 3. Insere parceiro financeiro fictício para seed
-- 4. Vincula comissões (margens do documento "Informações Produtos")
--    if_commission_pct  = teto pago pela IF à Vello (máximo da faixa)
--    vello_commission_pct = spread retido pela Vello (~25% do teto)
-- 5. Adiciona is_popular em tenant_products

-- ============================================================
-- LIMPEZA
-- ============================================================

TRUNCATE simulations;

DELETE FROM proposals
  WHERE product_id IN (SELECT id FROM products WHERE name = 'Empréstimo FGTS');

DELETE FROM product_financial_partners
  WHERE product_id IN (SELECT id FROM products WHERE name = 'Empréstimo FGTS');

DELETE FROM tenant_products
  WHERE product_id IN (SELECT id FROM products WHERE name = 'Empréstimo FGTS');

DELETE FROM products WHERE name = 'Empréstimo FGTS';

-- ============================================================
-- PARCEIRO FICTÍCIO
-- ============================================================

INSERT INTO financial_partners (id, name, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Banco Demo Vello', true);

-- ============================================================
-- COMISSÕES POR PRODUTO
-- ============================================================

-- FGTS: comissão 4% a 15%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 15.000, 5.000
FROM products p WHERE p.name = 'FGTS' AND p.category = 'pessoa_fisica';

-- Consignado CLT: comissão 0,25% a 4%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 4.000, 1.000
FROM products p WHERE p.name = 'Consignado CLT' AND p.category = 'pessoa_fisica';

-- Auto Equity: comissão 0,75% a 1,25%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 1.250, 0.250
FROM products p WHERE p.name = 'Empréstimo com Veículo em Garantia' AND p.category = 'pessoa_fisica';

-- CGI PF: comissão 1,5% a 3%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 3.000, 0.750
FROM products p WHERE p.name = 'Empréstimo com Imóvel em Garantia' AND p.category = 'pessoa_fisica';

-- Capital de Giro: comissão 1% a 3%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 3.000, 0.750
FROM products p WHERE p.name = 'Capital de Giro' AND p.category = 'pessoa_juridica';

-- Antecipação de Recebíveis: comissão 1% a 3%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 3.000, 0.750
FROM products p WHERE p.name = 'Antecipação de Recebíveis' AND p.category = 'pessoa_juridica';

-- CGI PJ: comissão 1,5% a 3%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 3.000, 0.750
FROM products p WHERE p.name = 'Empréstimo com Imóvel em Garantia' AND p.category = 'pessoa_juridica';

-- Financiamento Imobiliário: comissão 0,5% a 1,5%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 1.500, 0.375
FROM products p WHERE p.name = 'Financiamento Imobiliário' AND p.category = 'financiamentos';

-- Financiamento de Veículos: comissão 0,75% a 1,25%
INSERT INTO product_financial_partners (product_id, financial_partner_id, if_commission_pct, vello_commission_pct)
SELECT p.id, '00000000-0000-0000-0000-000000000001'::uuid, 1.250, 0.250
FROM products p WHERE p.name = 'Financiamento de Veículos' AND p.category = 'financiamentos';

-- ============================================================
-- IS_POPULAR EM TENANT_PRODUCTS
-- ============================================================

ALTER TABLE tenant_products
  ADD COLUMN is_popular BOOLEAN NOT NULL DEFAULT false;

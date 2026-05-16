-- Migration: seed_products
-- Insere os produtos da plataforma conforme documento "Informações Produtos".
-- Usa INSERT ... SELECT para resolver o product_type_id pelo slug, evitando UUIDs hardcoded.

-- ============================================================
-- CRÉDITO PESSOA FÍSICA
-- ============================================================

INSERT INTO products (name, description, product_type_id, category)
SELECT
  'FGTS',
  'Crédito com base no saque-aniversário do FGTS. Parcelas descontadas automaticamente do FGTS.',
  pt.id,
  'pessoa_fisica'
FROM product_types pt WHERE pt.slug = 'fgts';

INSERT INTO products (name, description, product_type_id, category,
                      min_term_months, max_term_months)
SELECT
  'Consignado CLT',
  'Empréstimo consignado privado para trabalhadores com carteira assinada (CLT), com parcelas descontadas diretamente em folha via eSocial.',
  pt.id,
  'pessoa_fisica',
  10, 36
FROM product_types pt WHERE pt.slug = 'consignado_privado';

INSERT INTO products (name, description, product_type_id, category,
                      min_rate_monthly)
SELECT
  'Empréstimo com Veículo em Garantia',
  'Crédito com garantia de veículo quitado, com limite de até 90% do valor do bem.',
  pt.id,
  'pessoa_fisica',
  1.49
FROM product_types pt WHERE pt.slug = 'auto_equity';

INSERT INTO products (name, description, product_type_id, category,
                      min_term_months, max_term_months, min_rate_monthly, max_rate_monthly)
SELECT
  'Empréstimo com Imóvel em Garantia',
  'Crédito com imóvel como garantia para pessoa física. Limite de 30% a 60% do valor do imóvel (mínimo R$150.000).',
  pt.id,
  'pessoa_fisica',
  36, 240, 1.19, 2.00
FROM product_types pt WHERE pt.slug = 'home_equity';

-- ============================================================
-- CRÉDITO PESSOA JURÍDICA
-- ============================================================

INSERT INTO products (name, description, product_type_id, category,
                      max_term_months, min_rate_monthly, max_rate_monthly)
SELECT
  'Capital de Giro',
  'Crédito para empresas com mais de R$ 250 mil de faturamento/ano e 2 anos de existência. Não aceito MEI. Carência de até 6 meses.',
  pt.id,
  'pessoa_juridica',
  60, 2.50, 8.00
FROM product_types pt WHERE pt.slug = 'capital_giro';

INSERT INTO products (name, description, product_type_id, category,
                      max_term_months, min_rate_monthly, max_rate_monthly)
SELECT
  'Antecipação de Recebíveis',
  'Antecipação de duplicatas, boletos ou contratos para obter crédito imediato. Carência de até 6 meses.',
  pt.id,
  'pessoa_juridica',
  60, 1.50, 8.00
FROM product_types pt WHERE pt.slug = 'antecipacao_recebiveis';

INSERT INTO products (name, description, product_type_id, category,
                      min_term_months, max_term_months, min_rate_monthly, max_rate_monthly)
SELECT
  'Empréstimo com Imóvel em Garantia',
  'Crédito com imóvel como garantia para pessoa jurídica. Limite de 30% a 60% do valor do imóvel (mínimo R$150.000).',
  pt.id,
  'pessoa_juridica',
  36, 240, 1.19, 2.00
FROM product_types pt WHERE pt.slug = 'home_equity_pj';

-- ============================================================
-- FINANCIAMENTOS
-- ============================================================

INSERT INTO products (name, description, product_type_id, category,
                      min_term_months, max_term_months, min_rate_monthly, max_amount)
SELECT
  'Financiamento Imobiliário',
  'Financiamento de imóveis com taxa a partir de 1,39% a.m. + IPCA. Limite de até R$ 4.000.000 ou 90% do valor do imóvel.',
  pt.id,
  'financiamentos',
  36, 240, 1.39, 4000000.00
FROM product_types pt WHERE pt.slug = 'financiamento_imovel';

INSERT INTO products (name, description, product_type_id, category,
                      max_term_months, min_rate_monthly, max_rate_monthly)
SELECT
  'Financiamento de Veículos',
  'Aquisição de carro, moto ou utilitário com pagamento parcelado. Limite de até 90% do valor do veículo.',
  pt.id,
  'financiamentos',
  60, 1.20, 4.50
FROM product_types pt WHERE pt.slug = 'financiamento_veiculo';

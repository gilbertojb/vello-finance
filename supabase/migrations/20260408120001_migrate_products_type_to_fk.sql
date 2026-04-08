-- Migration: migrate_products_type_to_fk
-- Troca a coluna type TEXT CHECK por product_type_id UUID FK em products.
-- Depende de: 20260408120000_create_product_types.sql

-- 1. Adicionar coluna FK (nullable para permitir UPDATE)
ALTER TABLE products
  ADD COLUMN product_type_id UUID REFERENCES product_types(id);

-- 2. Popular FK usando o slug (todos os valores existentes têm correspondência)
UPDATE products p
SET product_type_id = pt.id
FROM product_types pt
WHERE pt.slug = p.type;

-- 3. Tornar NOT NULL (falha se algum produto ficou sem correspondência)
ALTER TABLE products
  ALTER COLUMN product_type_id SET NOT NULL;

-- 4. Remover coluna antiga (a CHECK constraint é removida junto com a coluna)
ALTER TABLE products DROP COLUMN type;

-- 5. Índice para o join frequente products → product_types
CREATE INDEX idx_products_product_type ON products(product_type_id);

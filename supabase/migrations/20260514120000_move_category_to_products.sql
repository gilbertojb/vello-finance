-- supabase/migrations/20260514120000_move_category_to_products.sql

-- 1. Adicionar category em products (sem NOT NULL inicialmente)
ALTER TABLE products
  ADD COLUMN category TEXT CHECK (
    category IN ('pessoa_fisica', 'pessoa_juridica', 'financiamentos')
  );

-- 2. Popular a partir da esteira vinculada
UPDATE products p
  SET category = pt.category
  FROM product_types pt
  WHERE p.product_type_id = pt.id
    AND pt.category IS NOT NULL;

-- 3. Tornar obrigatório após popular
ALTER TABLE products
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN category SET DEFAULT 'pessoa_fisica';

-- 4. Remover category de product_types (esteiras não têm categoria)
ALTER TABLE product_types DROP COLUMN IF EXISTS category;

-- Migration add_internal_description_products
ALTER TABLE products ADD COLUMN internal_description TEXT;

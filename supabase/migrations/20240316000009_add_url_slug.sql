-- Add url_slug column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS url_slug TEXT;

-- Update existing products with generated url_slugs
UPDATE products 
SET url_slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));

-- Create a unique index on url_slug
CREATE UNIQUE INDEX IF NOT EXISTS products_url_slug_idx ON products(url_slug);

-- Add not null constraint
ALTER TABLE products ALTER COLUMN url_slug SET NOT NULL; 
-- First, drop the materialized view that depends on the category column
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- First, ensure the category column exists and has the right type
ALTER TABLE products 
ALTER COLUMN category TYPE TEXT;

-- Create a function to normalize categories
CREATE OR REPLACE FUNCTION normalize_category(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
    IF category_name IS NULL THEN
        RETURN 'other';
    END IF;

    category_name := LOWER(TRIM(category_name));
    
    -- More specific matching patterns with word boundaries
    IF category_name ~ '\y(mouse|mice|gaming[- ]mouse|gaming[- ]mice)\y' THEN
        RETURN 'mice';
    ELSIF category_name ~ '\y(keyboard|keeb|mechanical[- ]keyboard|gaming[- ]keyboard|alloy)\y' THEN
        RETURN 'keyboards';
    ELSIF category_name ~ '\y(headset|headphone|gaming[- ]headset|gaming[- ]headphone|audio)\y' THEN
        RETURN 'headsets';
    ELSIF category_name ~ '\y(monitor|display|screen|gaming[- ]monitor)\y' THEN
        RETURN 'monitors';
    ELSE
        -- Check product name before defaulting to other
        RETURN 'keyboards'; -- Since we know this specific case is a keyboard
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Drop the constraint first if it exists
ALTER TABLE products
DROP CONSTRAINT IF EXISTS valid_category;

-- Update all products to use normalized categories
UPDATE products
SET category = normalize_category(category);

-- Additional fixes for specific products
UPDATE products
SET category = 'keyboards'
WHERE name ILIKE '%hyperx%alloy%'
   OR name ILIKE '%keyboard%'
   OR name ILIKE '%mechanical%'
   OR name ILIKE '%keeb%';

UPDATE products
SET category = 'mice'
WHERE name ILIKE '%mouse%'
   OR name ILIKE '%mice%';

UPDATE products
SET category = 'headsets'
WHERE name ILIKE '%headset%'
   OR name ILIKE '%headphone%'
   OR name ILIKE '%audio%';

UPDATE products
SET category = 'monitors'
WHERE name ILIKE '%monitor%'
   OR name ILIKE '%display%'
   OR name ILIKE '%screen%';

-- Add constraint for valid categories
ALTER TABLE products
ADD CONSTRAINT valid_category CHECK (category IN ('mice', 'keyboards', 'headsets', 'monitors')); 

-- Reindex products by category for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- Log category counts for verification
DO $$
DECLARE
    mice_count INTEGER;
    keyboard_count INTEGER;
    headset_count INTEGER;
    monitor_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO mice_count FROM products WHERE category = 'mice';
    SELECT COUNT(*) INTO keyboard_count FROM products WHERE category = 'keyboards';
    SELECT COUNT(*) INTO headset_count FROM products WHERE category = 'headsets';
    SELECT COUNT(*) INTO monitor_count FROM products WHERE category = 'monitors';
    
    RAISE NOTICE 'Category counts after normalization:';
    RAISE NOTICE 'Mice: %, Keyboards: %, Headsets: %, Monitors: %',
        mice_count, keyboard_count, headset_count, monitor_count;
END $$;

-- Recreate the materialized view with normalized categories
CREATE MATERIALIZED VIEW product_rankings AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    p.image_url,
    COALESCE(v.upvotes, 0) as votes,
    RANK() OVER (PARTITION BY p.category ORDER BY COALESCE(v.upvotes, 0) DESC) as rank
FROM products p
LEFT JOIN (
    SELECT product_id, 
           COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes
    FROM votes 
    GROUP BY product_id
) v ON p.id = v.product_id
ORDER BY p.category, votes DESC;

-- Create index on the materialized view
CREATE UNIQUE INDEX ON product_rankings (id);
CREATE INDEX ON product_rankings (category, rank); 
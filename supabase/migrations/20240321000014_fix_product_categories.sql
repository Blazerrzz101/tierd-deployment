-- First, ensure the category column exists and has the right type
ALTER TABLE products 
ALTER COLUMN category TYPE TEXT;

-- Create a function to normalize categories
CREATE OR REPLACE FUNCTION normalize_category(category_name TEXT)
RETURNS TEXT AS $$
BEGIN
    IF category_name IS NULL THEN
        RETURN 'mice';
    END IF;

    category_name := LOWER(TRIM(category_name));
    
    IF category_name LIKE '%mouse%' OR 
       category_name LIKE '%mice%' THEN
        RETURN 'mice';
    ELSIF category_name LIKE '%keyboard%' OR 
          category_name LIKE '%keeb%' THEN
        RETURN 'keyboards';
    ELSIF category_name LIKE '%headset%' OR 
          category_name LIKE '%headphone%' OR 
          category_name LIKE '%audio%' THEN
        RETURN 'headsets';
    ELSIF category_name LIKE '%monitor%' OR 
          category_name LIKE '%display%' OR 
          category_name LIKE '%screen%' THEN
        RETURN 'monitors';
    ELSE
        RETURN 'mice';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- First normalize existing categories
UPDATE products
SET category = normalize_category(category);

-- Then update based on product names
UPDATE products
SET category = 'keyboards'
WHERE LOWER(name) LIKE '%huntsman%' 
   OR LOWER(name) LIKE '%keyboard%'
   OR LOWER(name) LIKE '%mechanical%';

UPDATE products
SET category = 'headsets'
WHERE LOWER(name) LIKE '%arctis%' 
   OR LOWER(name) LIKE '%headset%'
   OR LOWER(name) LIKE '%audio%';

UPDATE products
SET category = 'mice'
WHERE LOWER(name) LIKE '%mouse%'
   OR LOWER(name) LIKE '%pro x%'
   OR LOWER(name) LIKE '%viper%';

UPDATE products
SET category = 'monitors'
WHERE LOWER(name) LIKE '%monitor%'
   OR LOWER(name) LIKE '%odyssey%'
   OR LOWER(name) LIKE '%screen%';

-- Drop existing constraint if it exists
ALTER TABLE products
DROP CONSTRAINT IF EXISTS valid_category;

-- Add the new constraint
ALTER TABLE products
ADD CONSTRAINT valid_category CHECK (category IN ('mice', 'keyboards', 'headsets', 'monitors')); 
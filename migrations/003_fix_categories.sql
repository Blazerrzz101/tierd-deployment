-- Drop existing enum type and save current values
CREATE TEMP TABLE product_categories_backup AS
SELECT id, category::text FROM products;

-- Drop the enum type and column
DROP TYPE IF EXISTS product_category CASCADE;

-- Recreate enum type with kebab-case values
CREATE TYPE product_category AS ENUM (
    'gaming-mice',
    'gaming-keyboards',
    'gaming-monitors',
    'gaming-headsets',
    'gaming-chairs'
);

-- Add the column back
ALTER TABLE products ADD COLUMN category product_category;

-- Update the column with transformed values
UPDATE products p SET category = 
    CASE LOWER(b.category)
        WHEN 'gaming mice' THEN 'gaming-mice'::product_category
        WHEN 'gaming keyboards' THEN 'gaming-keyboards'::product_category
        WHEN 'gaming monitors' THEN 'gaming-monitors'::product_category
        WHEN 'gaming headsets' THEN 'gaming-headsets'::product_category
        WHEN 'gaming chairs' THEN 'gaming-chairs'::product_category
    END
FROM product_categories_backup b
WHERE p.id = b.id;

-- Drop the temporary table
DROP TABLE product_categories_backup;

-- Recreate the materialized view
DROP MATERIALIZED VIEW IF EXISTS product_rankings;
CREATE MATERIALIZED VIEW product_rankings AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.image_url,
    p.price,
    p.category,
    p.url_slug,
    p.specifications,
    COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 1), 0) as upvotes,
    COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = -1), 0) as downvotes,
    COALESCE(AVG(r.rating), 0) as rating,
    COALESCE(COUNT(DISTINCT r.id), 0) as review_count,
    COALESCE(
        COUNT(v.*) FILTER (WHERE v.vote_type = 1) -
        COUNT(v.*) FILTER (WHERE v.vote_type = -1),
        0
    ) as net_score,
    ROW_NUMBER() OVER (
        ORDER BY (
            COUNT(v.*) FILTER (WHERE v.vote_type = 1) -
            COUNT(v.*) FILTER (WHERE v.vote_type = -1)
        ) DESC
    ) as rank
FROM 
    products p
    LEFT JOIN votes v ON p.id = v.product_id
    LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY 
    p.id, p.name, p.description, p.image_url, p.price, p.category, p.url_slug, p.specifications; 
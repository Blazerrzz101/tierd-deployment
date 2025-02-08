-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Recreate the materialized view with proper relationships
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_counts AS (
    SELECT 
        product_id,
        COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes
    FROM product_votes
    GROUP BY product_id
)
SELECT 
    p.id,
    p.name,
    p.description,
    p.image_url,
    p.price,
    p.category,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    0.0 as rating,           -- Default rating since we have no reviews yet
    0 as review_count,       -- Default review count since we have no reviews yet
    COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0) as net_score,
    ROW_NUMBER() OVER (ORDER BY (COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0)) DESC) as rank
FROM 
    products p
    LEFT JOIN vote_counts v ON p.id = v.product_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_product_rankings_id ON product_rankings (id);

-- Add foreign key reference
COMMENT ON MATERIALIZED VIEW product_rankings IS 'Product rankings with vote counts';
COMMENT ON COLUMN product_rankings.id IS 'References products.id';

-- Set proper permissions
GRANT SELECT ON product_rankings TO anon, authenticated;
GRANT ALL ON product_rankings TO postgres, service_role;

-- Refresh the view
REFRESH MATERIALIZED VIEW product_rankings; 
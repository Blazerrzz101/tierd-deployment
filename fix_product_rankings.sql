-- Drop existing materialized view and related objects
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
),
review_stats AS (
    SELECT 
        product_id,
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
    FROM reviews
    GROUP BY product_id
)
SELECT 
    p.id,
    p.name,
    p.description,
    p.image_url,
    p.price,
    p.category,
    p.slug,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(r.avg_rating, 0) as rating,
    COALESCE(r.review_count, 0) as review_count,
    COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0) as net_score,
    ROW_NUMBER() OVER (ORDER BY (COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0)) DESC) as rank
FROM 
    products p
    LEFT JOIN vote_counts v ON p.id = v.product_id
    LEFT JOIN review_stats r ON p.id = r.product_id;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_product_rankings_id ON product_rankings (id);

-- Set proper permissions
GRANT SELECT ON product_rankings TO anon, authenticated;
GRANT ALL ON product_rankings TO postgres, service_role;

-- Refresh the view
REFRESH MATERIALIZED VIEW product_rankings; 
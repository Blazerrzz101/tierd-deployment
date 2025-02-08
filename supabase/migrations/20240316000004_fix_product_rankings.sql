-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Recreate the materialized view with proper relationships
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_counts AS (
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.price,
        p.image_url,
        p.url_slug,
        COALESCE(COUNT(CASE WHEN pv.vote_type = 'up' THEN 1 END), 0) as upvotes,
        COALESCE(COUNT(CASE WHEN pv.vote_type = 'down' THEN 1 END), 0) as downvotes,
        COALESCE(COUNT(CASE WHEN pv.vote_type = 'neutral' THEN 1 END), 0) as neutral_votes
    FROM products p
    LEFT JOIN product_votes pv ON p.id = pv.product_id
    GROUP BY p.id, p.name, p.description, p.category, p.price, p.image_url, p.url_slug
)
SELECT 
    id,
    name,
    description,
    category,
    price,
    image_url,
    url_slug,
    upvotes,
    downvotes,
    neutral_votes,
    RANK() OVER (ORDER BY (upvotes - downvotes) DESC) as rank
FROM vote_counts;

-- Create indexes
CREATE UNIQUE INDEX ON product_rankings (id);
CREATE INDEX ON product_rankings (category);
CREATE INDEX ON product_rankings (url_slug);

-- Grant permissions
GRANT SELECT ON product_rankings TO anon, authenticated;
GRANT ALL ON product_rankings TO postgres, service_role;

-- Refresh the view
REFRESH MATERIALIZED VIEW product_rankings; 
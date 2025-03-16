-- Drop triggers first
DROP TRIGGER IF EXISTS refresh_rankings_vote ON votes;
DROP TRIGGER IF EXISTS refresh_rankings_review ON reviews;
DROP TRIGGER IF EXISTS refresh_rankings_trigger ON votes;

-- Drop functions
DROP FUNCTION IF EXISTS trigger_refresh_rankings;
DROP FUNCTION IF EXISTS refresh_product_rankings;

-- Drop materialized views
DROP MATERIALIZED VIEW IF EXISTS product_rankings;
DROP MATERIALIZED VIEW IF EXISTS category_stats;

-- Drop constraint
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;

-- Fix existing vote data
ALTER TABLE votes ALTER COLUMN vote_type TYPE integer USING 
    CASE 
        WHEN vote_type::text = 'up' THEN 1
        WHEN vote_type::text = 'down' THEN -1
        ELSE NULL
    END;

-- Add constraint back
ALTER TABLE votes ADD CONSTRAINT votes_vote_type_check CHECK (vote_type IN (1, -1));

-- Create function to refresh rankings
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
    REFRESH MATERIALIZED VIEW CONCURRENTLY category_stats;
END;
$$;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_refresh_rankings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM refresh_product_rankings();
    RETURN NULL;
END;
$$;

-- Recreate materialized views
CREATE MATERIALIZED VIEW product_rankings AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    p.image_url,
    p.url_slug,
    p.specifications,
    COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 1), 0) as upvotes,
    COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = -1), 0) as downvotes,
    COALESCE(AVG(r.rating), 0) as rating,
    COUNT(DISTINCT r.id) as review_count,
    COALESCE(
        COUNT(v.*) FILTER (WHERE v.vote_type = 1) -
        COUNT(v.*) FILTER (WHERE v.vote_type = -1),
        0
    ) as score,
    ROW_NUMBER() OVER (ORDER BY COUNT(v.*) DESC) as rank
FROM products p
LEFT JOIN votes v ON p.id = v.product_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name, p.description, p.category, p.price, p.image_url, p.url_slug, p.specifications;

CREATE MATERIALIZED VIEW category_stats AS
SELECT 
    p.category,
    COUNT(DISTINCT p.id) as product_count,
    AVG(p.price) as avg_price,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price,
    SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END) as total_upvotes,
    SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END) as total_downvotes
FROM products p
LEFT JOIN votes v ON p.id = v.product_id
GROUP BY p.category;

-- Create indexes for the materialized views
CREATE UNIQUE INDEX ON product_rankings(id);
CREATE INDEX ON product_rankings(category);
CREATE INDEX ON product_rankings(rank);

CREATE UNIQUE INDEX ON category_stats(category);

-- Create triggers
CREATE TRIGGER refresh_rankings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_rankings(); 
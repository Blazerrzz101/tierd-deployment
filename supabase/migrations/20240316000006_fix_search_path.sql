-- Drop existing functions and views
DROP FUNCTION IF EXISTS refresh_product_rankings CASCADE;
DROP FUNCTION IF EXISTS update_product_ranking CASCADE;
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Recreate the materialized view with proper security
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

-- Create function to refresh rankings with explicit search path
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
    RETURN NULL;
END;
$$;

-- Create function to update product ranking with explicit search path
CREATE OR REPLACE FUNCTION update_product_ranking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW product_rankings;
    RETURN NEW;
END;
$$;

-- Set proper permissions
REVOKE ALL ON product_rankings FROM PUBLIC;
GRANT SELECT ON product_rankings TO authenticated, anon;
GRANT ALL ON product_rankings TO postgres, service_role;

-- Revoke and regrant function execution permissions
REVOKE ALL ON FUNCTION refresh_product_rankings() FROM PUBLIC;
REVOKE ALL ON FUNCTION update_product_ranking() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION refresh_product_rankings() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_product_ranking() TO authenticated, anon;

-- Refresh the view
REFRESH MATERIALIZED VIEW product_rankings; 
-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Create the materialized view
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

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_product_rankings_id ON product_rankings (id);

-- Grant necessary permissions
GRANT SELECT ON product_rankings TO authenticated, anon;

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view
DROP TRIGGER IF EXISTS refresh_rankings_on_vote ON votes;
CREATE TRIGGER refresh_rankings_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_rankings();

DROP TRIGGER IF EXISTS refresh_rankings_on_review ON reviews;
CREATE TRIGGER refresh_rankings_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_rankings(); 
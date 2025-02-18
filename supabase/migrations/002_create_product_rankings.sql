-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Create the materialized view
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_counts AS (
    SELECT 
        product_id,
        COUNT(CASE WHEN vote_type = 1 THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = -1 THEN 1 END) as downvotes,
        COUNT(*) as total_votes
    FROM public.votes
    GROUP BY product_id
),
review_stats AS (
    SELECT 
        product_id,
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
    FROM public.reviews
    GROUP BY product_id
)
SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    p.image_url,
    p.url_slug,
    p.specifications,
    COALESCE(vc.upvotes, 0) as upvotes,
    COALESCE(vc.downvotes, 0) as downvotes,
    COALESCE(vc.total_votes, 0) as total_votes,
    COALESCE(rs.avg_rating, 0) as rating,
    COALESCE(rs.review_count, 0) as review_count,
    COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0) as score,
    (
        (COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0)) * 0.7 +
        (COALESCE(rs.avg_rating, 0) * COALESCE(rs.review_count, 0)) * 0.3
    ) as ranking_score,
    RANK() OVER (
        ORDER BY (
            (COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0)) * 0.7 +
            (COALESCE(rs.avg_rating, 0) * COALESCE(rs.review_count, 0)) * 0.3
        ) DESC,
        p.created_at DESC
    ) as rank
FROM public.products p
LEFT JOIN vote_counts vc ON p.id = vc.product_id
LEFT JOIN review_stats rs ON p.id = rs.product_id;

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
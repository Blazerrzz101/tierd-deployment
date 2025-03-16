-- Drop existing function
DROP FUNCTION IF EXISTS get_product_rankings(text);

-- Create the function with proper category slug handling
CREATE OR REPLACE FUNCTION get_product_rankings(p_category text DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    category_slug TEXT,
    price DECIMAL,
    image_url TEXT,
    url_slug TEXT,
    specifications JSONB,
    upvotes BIGINT,
    downvotes BIGINT,
    rating DECIMAL,
    review_count BIGINT,
    total_votes BIGINT,
    score BIGINT,
    ranking_score DECIMAL,
    rank BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.name,
        pr.description,
        pr.category,
        LOWER(REPLACE(pr.category, ' ', '-')) as category_slug,
        pr.price,
        pr.image_url,
        pr.url_slug,
        pr.specifications,
        pr.upvotes,
        pr.downvotes,
        pr.rating,
        pr.review_count,
        pr.total_votes,
        pr.score,
        (
            (pr.upvotes - pr.downvotes) * 0.7 +
            (pr.rating * pr.review_count) * 0.3
        ) as ranking_score,
        pr.rank
    FROM product_rankings pr
    WHERE 
        CASE 
            WHEN p_category IS NULL THEN true
            ELSE pr.category = p_category
        END
    ORDER BY 
        CASE 
            WHEN p_category IS NULL THEN pr.category
            ELSE pr.rank::text
        END,
        pr.rank;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_product_rankings(TEXT) TO authenticated, anon;

-- Refresh materialized view to ensure data is up to date
REFRESH MATERIALIZED VIEW product_rankings; 
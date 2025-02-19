-- Create get_product_rankings function

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_product_rankings(TEXT);

-- Create the function
CREATE OR REPLACE FUNCTION get_product_rankings(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
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
            WHEN p_category IS NOT NULL THEN 
                LOWER(REPLACE(pr.category, ' ', '-')) = LOWER(p_category)
            ELSE true
        END
    ORDER BY pr.rank ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_product_rankings(TEXT) TO authenticated, anon;

-- Drop function if it exists
DROP FUNCTION IF EXISTS get_product_rankings(product_category);
DROP FUNCTION IF EXISTS get_product_rankings(TEXT);

-- Create the function
CREATE OR REPLACE FUNCTION get_product_rankings(p_category TEXT = NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    category product_category,
    url_slug VARCHAR(255),
    specifications JSONB,
    upvotes BIGINT,
    downvotes BIGINT,
    rating NUMERIC,
    review_count BIGINT,
    net_score BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pr.id,
        pr.name,
        pr.description,
        pr.image_url,
        pr.price,
        pr.category,
        pr.url_slug,
        pr.specifications,
        pr.upvotes,
        pr.downvotes,
        pr.rating,
        pr.review_count,
        pr.net_score,
        pr.rank
    FROM product_rankings pr
    WHERE 
        CASE 
            WHEN p_category IS NOT NULL THEN 
                pr.category::text = INITCAP(REPLACE(p_category, '-', ' '))
            ELSE true
        END
    ORDER BY pr.rank ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_product_rankings(TEXT) TO authenticated, anon; 
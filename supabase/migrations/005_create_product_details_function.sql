-- Drop function if it exists
DROP FUNCTION IF EXISTS get_product_details(TEXT);

-- Create the function
CREATE OR REPLACE FUNCTION get_product_details(p_slug TEXT)
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
    rank BIGINT,
    stock_status TEXT,
    user_vote INTEGER,
    related_products JSON
) AS $$
BEGIN
    RETURN QUERY
    WITH product_details AS (
        SELECT 
            pr.*,
            CASE 
                WHEN pr.specifications->>'stock_quantity' IS NULL 
                    OR (pr.specifications->>'stock_quantity')::int > 10 THEN 'in_stock'
                WHEN (pr.specifications->>'stock_quantity')::int > 0 THEN 'low_stock'
                ELSE 'out_of_stock'
            END as stock_status,
            (
                SELECT json_agg(related.*)
                FROM (
                    SELECT 
                        p2.id,
                        p2.name,
                        p2.url_slug,
                        p2.price,
                        p2.category,
                        COALESCE(COUNT(v2.*) FILTER (WHERE v2.vote_type = 1), 0) -
                        COALESCE(COUNT(v2.*) FILTER (WHERE v2.vote_type = -1), 0) as votes
                    FROM product_rankings p2
                    LEFT JOIN votes v2 ON p2.id = v2.product_id
                    WHERE p2.category = pr.category 
                        AND p2.id != pr.id
                    GROUP BY p2.id, p2.name, p2.url_slug, p2.price, p2.category
                    ORDER BY votes DESC
                    LIMIT 3
                ) related
            ) as related_products
        FROM product_rankings pr
        WHERE pr.url_slug = p_slug
    )
    SELECT 
        pd.id,
        pd.name,
        pd.description,
        pd.image_url,
        pd.price,
        pd.category,
        pd.url_slug,
        pd.specifications,
        pd.upvotes,
        pd.downvotes,
        pd.rating,
        pd.review_count,
        pd.net_score,
        pd.rank,
        pd.stock_status,
        NULL::INTEGER as user_vote,
        pd.related_products
    FROM product_details pd;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION get_product_details(TEXT) TO authenticated, anon; 
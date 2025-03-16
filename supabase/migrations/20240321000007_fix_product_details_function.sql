-- Drop existing function
DROP FUNCTION IF EXISTS get_product_details(text);

-- Create function to get product details
CREATE OR REPLACE FUNCTION get_product_details(p_slug TEXT)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    category text,
    price numeric,
    image_url text,
    url_slug text,
    specifications jsonb,
    created_at timestamptz,
    updated_at timestamptz,
    upvotes bigint,
    downvotes bigint,
    rating numeric,
    review_count bigint,
    score bigint,
    rank bigint
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vote_stats AS (
        SELECT 
            p.id,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type::integer = 1), 0) as upvotes,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type::integer = -1), 0) as downvotes,
            COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as rating,
            COUNT(DISTINCT r.id) as review_count,
            COALESCE(
                COUNT(v.*) FILTER (WHERE v.vote_type::integer = 1) -
                COUNT(v.*) FILTER (WHERE v.vote_type::integer = -1),
                0
            ) as score
        FROM products p
        LEFT JOIN votes v ON p.id = v.product_id
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.url_slug = p_slug
        GROUP BY p.id
    )
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.price,
        COALESCE(p.image_url, '/placeholder.png'),
        p.url_slug,
        p.specifications,
        p.created_at,
        p.updated_at,
        vs.upvotes,
        vs.downvotes,
        vs.rating,
        vs.review_count,
        vs.score,
        RANK() OVER (ORDER BY vs.score DESC, vs.rating DESC, p.created_at DESC)
    FROM products p
    JOIN vote_stats vs ON vs.id = p.id
    WHERE p.url_slug = p_slug;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_product_details(text) TO authenticated, anon; 
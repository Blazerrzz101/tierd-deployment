-- Drop existing function
DROP FUNCTION IF EXISTS get_product_rankings(text);

-- Create function to get product rankings
CREATE OR REPLACE FUNCTION get_product_rankings(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    name text,
    description text,
    category text,
    category_slug text,
    price numeric,
    image_url text,
    url_slug text,
    specifications jsonb,
    upvotes bigint,
    downvotes bigint,
    rating numeric,
    review_count bigint,
    total_votes bigint,
    score bigint,
    ranking_score numeric,
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
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 1), 0) as upvotes,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = -1), 0) as downvotes,
            COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as rating,
            COUNT(DISTINCT r.id) as review_count,
            GREATEST(1, EXTRACT(EPOCH FROM (now() - p.created_at))/3600) as hours_since_created
        FROM products p
        LEFT JOIN votes v ON p.id = v.product_id
        LEFT JOIN reviews r ON p.id = r.product_id
        GROUP BY p.id
    ),
    scores AS (
        SELECT 
            p.*,
            vs.upvotes,
            vs.downvotes,
            vs.rating,
            vs.review_count,
            vs.upvotes + vs.downvotes as total_votes,
            vs.upvotes - vs.downvotes as score,
            -- Reddit-style hot score
            LOG(GREATEST(1, vs.upvotes + vs.downvotes)) +
            (vs.upvotes - vs.downvotes)::FLOAT / 
            GREATEST(1, vs.upvotes + vs.downvotes) / 
            POWER((vs.hours_since_created + 2), 1.8) as ranking_score
        FROM products p
        JOIN vote_stats vs ON vs.id = p.id
        WHERE (p_category IS NULL OR p.category::text = p_category)
    )
    SELECT 
        s.id,
        s.name,
        s.description,
        s.category::text,
        LOWER(REPLACE(s.category::text, ' ', '-')) as category_slug,
        s.price,
        COALESCE(s.image_url, '/placeholder.png'),
        s.url_slug,
        s.specifications,
        s.upvotes,
        s.downvotes,
        s.rating,
        s.review_count,
        s.total_votes,
        s.score,
        s.ranking_score,
        RANK() OVER (ORDER BY s.ranking_score DESC, s.score DESC, s.created_at DESC)
    FROM scores s
    ORDER BY rank ASC;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_product_rankings(text) TO authenticated, anon; 
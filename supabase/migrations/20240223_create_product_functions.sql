-- Create function to get product rankings by category
CREATE OR REPLACE FUNCTION get_product_rankings(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    category product_category,
    price DECIMAL(10,2),
    image_url TEXT,
    url_slug VARCHAR(255),
    specifications JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    upvotes BIGINT,
    downvotes BIGINT,
    rating DECIMAL(3,2),
    review_count BIGINT,
    score BIGINT,
    rank BIGINT
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_time TIMESTAMPTZ;
BEGIN
    -- Get current time once to ensure consistency
    v_current_time := now();
    
    RETURN QUERY
    WITH product_stats AS (
        SELECT 
            p.id,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 'upvote'), 0) as upvotes,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 'downvote'), 0) as downvotes,
            COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as rating,
            COUNT(DISTINCT r.id) as review_count,
            COALESCE(
                COUNT(v.*) FILTER (WHERE v.vote_type = 'upvote') -
                COUNT(v.*) FILTER (WHERE v.vote_type = 'downvote'),
                0
            ) as score
        FROM public.products p
        LEFT JOIN public.votes v ON p.id = v.product_id
        LEFT JOIN public.reviews r ON p.id = r.product_id
        WHERE (p_category IS NULL OR p.category::text = p_category)
        GROUP BY p.id
    ),
    ranked_products AS (
        SELECT 
            p.*,
            ps.upvotes,
            ps.downvotes,
            ps.rating,
            ps.review_count,
            ps.score,
            ROW_NUMBER() OVER (
                ORDER BY ps.score DESC, ps.rating DESC, p.created_at DESC
            ) as rank
        FROM public.products p
        JOIN product_stats ps ON p.id = ps.id
        WHERE (p_category IS NULL OR p.category::text = p_category)
    )
    SELECT 
        rp.id,
        rp.name,
        rp.description,
        rp.category::product_category,
        rp.price,
        COALESCE(rp.image_url, '/placeholder.png'),
        rp.url_slug,
        rp.specifications,
        rp.created_at,
        rp.updated_at,
        rp.upvotes,
        rp.downvotes,
        rp.rating,
        rp.review_count,
        rp.score,
        rp.rank
    FROM ranked_products rp
    ORDER BY rp.rank ASC;
END;
$$;

-- Create function to get product details
CREATE OR REPLACE FUNCTION get_product_details(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    price DECIMAL,
    image_url TEXT,
    url_slug TEXT,
    specifications JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    upvotes BIGINT,
    downvotes BIGINT,
    rating DECIMAL,
    review_count BIGINT,
    score BIGINT,
    rank BIGINT
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_id UUID;
BEGIN
    -- Log the input
    RAISE NOTICE 'Fetching product details for slug: %', p_slug;

    -- First get the product ID to avoid ambiguity
    SELECT products.id INTO v_product_id
    FROM products
    WHERE products.url_slug = p_slug;

    -- Return early if product not found
    IF v_product_id IS NULL THEN
        RAISE NOTICE 'No product found with slug: %', p_slug;
        RETURN;
    END IF;

    RETURN QUERY
    WITH product_stats AS (
        SELECT 
            v_product_id as id,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 'upvote'), 0) as upvotes,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 'downvote'), 0) as downvotes,
            COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as rating,
            COUNT(DISTINCT r.id) as review_count,
            COALESCE(
                COUNT(v.*) FILTER (WHERE v.vote_type = 'upvote') -
                COUNT(v.*) FILTER (WHERE v.vote_type = 'downvote'),
                0
            ) as score
        FROM votes v
        LEFT JOIN reviews r ON r.product_id = v_product_id
        WHERE v.product_id = v_product_id
        GROUP BY v_product_id
    ),
    product_rank AS (
        SELECT pr.rank as product_rank
        FROM product_rankings pr
        WHERE pr.id = v_product_id
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
        COALESCE(ps.upvotes, 0),
        COALESCE(ps.downvotes, 0),
        COALESCE(ps.rating, 0),
        COALESCE(ps.review_count, 0),
        COALESCE(ps.score, 0),
        COALESCE((SELECT product_rank FROM product_rank), 0)
    FROM products p
    LEFT JOIN product_stats ps ON ps.id = p.id
    WHERE p.id = v_product_id;
END;
$$;

-- Create function to vote for a product
CREATE OR REPLACE FUNCTION vote_for_product(
    p_product_id UUID,
    p_vote_type TEXT
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote TEXT;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate vote type
    IF p_vote_type NOT IN ('upvote', 'downvote') THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either upvote or downvote';
    END IF;

    -- Check for existing vote
    SELECT vote_type INTO v_existing_vote
    FROM votes
    WHERE product_id = p_product_id AND user_id = v_user_id;

    -- Handle the vote
    IF v_existing_vote IS NULL THEN
        -- Insert new vote
        INSERT INTO votes (product_id, user_id, vote_type)
        VALUES (p_product_id, v_user_id, p_vote_type);
    ELSIF v_existing_vote = p_vote_type THEN
        -- Remove vote if clicking the same type again
        DELETE FROM votes
        WHERE product_id = p_product_id AND user_id = v_user_id;
    ELSE
        -- Update vote if changing from upvote to downvote or vice versa
        UPDATE votes
        SET vote_type = p_vote_type,
            updated_at = now()
        WHERE product_id = p_product_id AND user_id = v_user_id;
    END IF;

    -- Refresh the rankings
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
END;
$$; 
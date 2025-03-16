-- Drop materialized views first
DROP MATERIALIZED VIEW IF EXISTS product_rankings;
DROP MATERIALIZED VIEW IF EXISTS category_stats;

-- Drop existing function
DROP FUNCTION IF EXISTS public.vote_for_product(uuid, text);
DROP FUNCTION IF EXISTS public.vote_for_product(uuid, integer, text);

-- Create the vote function with proper parameter names
CREATE OR REPLACE FUNCTION public.vote_for_product(
    p_product_id uuid,
    p_vote_type integer,
    p_client_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id uuid;
    v_existing_vote record;
    v_result_vote_type integer;
    result jsonb;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Validate vote type
    IF p_vote_type NOT IN (1, -1) THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either 1 or -1';
    END IF;

    -- Check for existing vote by this user/client for this product
    SELECT id, vote_type INTO v_existing_vote
    FROM votes
    WHERE product_id = p_product_id
    AND (
        (user_id = v_user_id AND v_user_id IS NOT NULL)
        OR
        (user_id IS NULL AND metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
    );

    -- Handle the vote
    IF v_existing_vote IS NULL THEN
        -- Insert new vote
        INSERT INTO votes (product_id, user_id, vote_type, metadata)
        VALUES (
            p_product_id,
            v_user_id,
            p_vote_type,
            CASE 
                WHEN v_user_id IS NULL AND p_client_id IS NOT NULL THEN 
                    jsonb_build_object('client_id', p_client_id)
                ELSE '{}'::jsonb
            END
        );
        v_result_vote_type := p_vote_type;
    ELSIF v_existing_vote.vote_type = p_vote_type THEN
        -- Remove vote if same type (toggle behavior)
        DELETE FROM votes
        WHERE id = v_existing_vote.id;
        v_result_vote_type := NULL;
    ELSE
        -- Update vote type if different
        UPDATE votes
        SET vote_type = p_vote_type,
            updated_at = now()
        WHERE id = v_existing_vote.id;
        v_result_vote_type := p_vote_type;
    END IF;

    -- Immediately get updated vote counts for this product
    WITH vote_counts AS (
        SELECT 
            COUNT(*) FILTER (WHERE vote_type = 1) as upvotes,
            COUNT(*) FILTER (WHERE vote_type = -1) as downvotes
        FROM votes
        WHERE product_id = p_product_id
    )
    SELECT jsonb_build_object(
        'success', true,
        'vote_type', v_result_vote_type,
        'upvotes', COALESCE((SELECT upvotes FROM vote_counts), 0),
        'downvotes', COALESCE((SELECT downvotes FROM vote_counts), 0),
        'has_voted', v_result_vote_type IS NOT NULL
    ) INTO result;

    -- Refresh materialized view asynchronously using pg_background
    PERFORM pg_notify('refresh_rankings', '');

    RETURN result;
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.vote_for_product(uuid, integer, text) TO authenticated, anon;

-- Make sure votes table has NOT NULL constraints for required fields
ALTER TABLE public.votes 
    ALTER COLUMN product_id SET NOT NULL,
    ALTER COLUMN vote_type SET NOT NULL,
    ALTER COLUMN vote_type TYPE integer USING 
        CASE 
            WHEN vote_type::text = 'up' THEN 1
            WHEN vote_type::text = 'upvote' THEN 1
            WHEN vote_type::text = 'down' THEN -1
            WHEN vote_type::text = 'downvote' THEN -1
            ELSE NULL
        END;

-- Add constraint for vote types
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS vote_type_check;
ALTER TABLE public.votes ADD CONSTRAINT vote_type_check CHECK (vote_type IN (1, -1));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_product_user ON votes(product_id, user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_votes_client_id ON votes(product_id, (metadata->>'client_id')) WHERE user_id IS NULL;

-- Add unique constraints to prevent duplicate votes
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_product_user_unique;
ALTER TABLE public.votes ADD CONSTRAINT votes_product_user_unique 
    UNIQUE (product_id, user_id) 
    WHERE user_id IS NOT NULL;

ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_product_client_unique;
ALTER TABLE public.votes ADD CONSTRAINT votes_product_client_unique 
    UNIQUE (product_id, (metadata->>'client_id')) 
    WHERE user_id IS NULL AND metadata->>'client_id' IS NOT NULL;

-- Trigger function to refresh rankings
CREATE OR REPLACE FUNCTION public.refresh_rankings_trigger()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify('refresh_rankings', '');
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on votes table
DROP TRIGGER IF EXISTS refresh_rankings_on_vote ON public.votes;
CREATE TRIGGER refresh_rankings_on_vote
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH STATEMENT EXECUTE FUNCTION public.refresh_rankings_trigger();

-- Recreate materialized views
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_counts AS (
    SELECT 
        product_id,
        COUNT(*) FILTER (WHERE vote_type = 1) as upvotes,
        COUNT(*) FILTER (WHERE vote_type = -1) as downvotes,
        COUNT(*) FILTER (WHERE vote_type = 1) - COUNT(*) FILTER (WHERE vote_type = -1) as score
    FROM votes
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
    COALESCE(AVG(r.rating), 0) as rating,
    COUNT(DISTINCT r.id) as review_count,
    COALESCE(vc.score, 0) as score,
    ROW_NUMBER() OVER (ORDER BY COALESCE(vc.score, 0) DESC) as rank
FROM products p
LEFT JOIN vote_counts vc ON p.id = vc.product_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name, p.description, p.category, p.price, p.image_url, p.url_slug, p.specifications, vc.upvotes, vc.downvotes, vc.score;

-- Create listener function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_product_rankings()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for the materialized views
CREATE UNIQUE INDEX IF NOT EXISTS product_rankings_id_idx ON product_rankings(id);
CREATE INDEX IF NOT EXISTS product_rankings_category_idx ON product_rankings(category);
CREATE INDEX IF NOT EXISTS product_rankings_rank_idx ON product_rankings(rank);

-- Create a simple function to check if a user has voted for a product
CREATE OR REPLACE FUNCTION public.has_user_voted(
    p_product_id uuid,
    p_client_id text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_vote_type integer;
    result jsonb;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Get vote if it exists
    SELECT vote_type INTO v_vote_type
    FROM votes
    WHERE product_id = p_product_id
    AND (
        (user_id = v_user_id AND v_user_id IS NOT NULL)
        OR
        (user_id IS NULL AND metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
    );
    
    -- Return result
    result := jsonb_build_object(
        'has_voted', v_vote_type IS NOT NULL,
        'vote_type', v_vote_type
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission for the has_user_voted function
GRANT EXECUTE ON FUNCTION public.has_user_voted(uuid, text) TO authenticated, anon;

CREATE MATERIALIZED VIEW category_stats AS
SELECT 
    p.category,
    COUNT(DISTINCT p.id) as product_count,
    AVG(p.price) as avg_price,
    MIN(p.price) as min_price,
    MAX(p.price) as max_price,
    SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END) as total_upvotes,
    SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END) as total_downvotes
FROM products p
LEFT JOIN votes v ON p.id = v.product_id
GROUP BY p.category;

-- Create indexes for the materialized views
CREATE UNIQUE INDEX ON product_rankings(id);
CREATE INDEX ON product_rankings(category);
CREATE INDEX ON product_rankings(rank);

CREATE UNIQUE INDEX ON category_stats(category); 
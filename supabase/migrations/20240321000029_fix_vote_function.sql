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
    v_existing_vote integer;
    v_result_vote_type integer;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Validate vote type
    IF p_vote_type NOT IN (1, -1) THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either 1 or -1';
    END IF;

    -- Check for existing vote
    SELECT vote_type INTO v_existing_vote
    FROM votes
    WHERE product_id = p_product_id
    AND (
        (user_id = v_user_id AND v_user_id IS NOT NULL)
        OR
        (user_id IS NULL AND metadata->>'client_id' = p_client_id)
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
                WHEN v_user_id IS NULL THEN jsonb_build_object('client_id', p_client_id)
                ELSE '{}'::jsonb
            END
        );
        v_result_vote_type := p_vote_type;
    ELSIF v_existing_vote = p_vote_type THEN
        -- Remove vote if same type
        DELETE FROM votes
        WHERE product_id = p_product_id
        AND (
            (user_id = v_user_id AND v_user_id IS NOT NULL)
            OR
            (user_id IS NULL AND metadata->>'client_id' = p_client_id)
        );
        v_result_vote_type := NULL;
    ELSE
        -- Update vote type
        UPDATE votes
        SET vote_type = p_vote_type,
            updated_at = now()
        WHERE product_id = p_product_id
        AND (
            (user_id = v_user_id AND v_user_id IS NOT NULL)
            OR
            (user_id IS NULL AND metadata->>'client_id' = p_client_id)
        );
        v_result_vote_type := p_vote_type;
    END IF;

    -- Get updated vote counts
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
        'downvotes', COALESCE((SELECT downvotes FROM vote_counts), 0)
    ) INTO STRICT result;

    RETURN result;
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.vote_for_product(uuid, integer, text) TO authenticated, anon;

-- Ensure votes table has proper structure
ALTER TABLE public.votes 
    ALTER COLUMN vote_type TYPE integer USING 
    CASE 
        WHEN vote_type::text = 'up' THEN 1
        WHEN vote_type::text = 'down' THEN -1
        ELSE NULL
    END;

-- Add constraint for vote types
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS vote_type_check;
ALTER TABLE public.votes ADD CONSTRAINT vote_type_check CHECK (vote_type IN (1, -1));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_product_user ON votes(product_id, user_id);
CREATE INDEX IF NOT EXISTS idx_votes_client_id ON votes((metadata->>'client_id')) WHERE user_id IS NULL;

-- Add unique constraint to prevent duplicate votes
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_product_user_unique;
ALTER TABLE public.votes ADD CONSTRAINT votes_product_user_unique 
    UNIQUE (product_id, user_id) 
    WHERE user_id IS NOT NULL;

ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_product_client_unique;
ALTER TABLE public.votes ADD CONSTRAINT votes_product_client_unique 
    UNIQUE (product_id, (metadata->>'client_id')) 
    WHERE user_id IS NULL AND metadata->>'client_id' IS NOT NULL;

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
-- Fix the vote function to prevent NaN issues and ensure proper vote tracking
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
    v_upvotes integer;
    v_downvotes integer;
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

    -- Count votes directly to avoid any potential issues
    SELECT 
        COUNT(*) FILTER (WHERE vote_type = 1), 
        COUNT(*) FILTER (WHERE vote_type = -1)
    INTO v_upvotes, v_downvotes
    FROM votes
    WHERE product_id = p_product_id;

    -- Build result object with explicit integer casting to prevent NaN
    result := jsonb_build_object(
        'success', true,
        'vote_type', v_result_vote_type,
        'upvotes', COALESCE(v_upvotes, 0),
        'downvotes', COALESCE(v_downvotes, 0),
        'score', COALESCE(v_upvotes, 0) - COALESCE(v_downvotes, 0),
        'has_voted', v_result_vote_type IS NOT NULL
    );

    -- Refresh materialized view for consistent data
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;

    RETURN result;
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.vote_for_product(uuid, integer, text) TO authenticated, anon;

-- Create or update a function to check if a user has voted
CREATE OR REPLACE FUNCTION public.has_user_voted(
    p_product_id uuid,
    p_client_id text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_user_id uuid;
    v_vote_record record;
    result jsonb;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Get vote if it exists
    SELECT id, vote_type INTO v_vote_record
    FROM votes
    WHERE product_id = p_product_id
    AND (
        (user_id = v_user_id AND v_user_id IS NOT NULL)
        OR
        (user_id IS NULL AND metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
    );
    
    -- Return result with explicit vote type
    result := jsonb_build_object(
        'has_voted', v_vote_record.id IS NOT NULL,
        'vote_type', v_vote_record.vote_type,
        'vote_id', v_vote_record.id
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.has_user_voted(uuid, text) TO authenticated, anon; 
-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.get_user_votes;
DROP FUNCTION IF EXISTS public.vote_for_product;

-- Create function to get user votes
CREATE OR REPLACE FUNCTION get_user_votes(
    p_product_ids uuid[],
    p_client_id text DEFAULT NULL
)
RETURNS TABLE (
    product_id uuid,
    vote_type integer,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.product_id,
        v.vote_type,
        v.created_at
    FROM votes v
    WHERE v.product_id = ANY(p_product_ids)
    AND (
        (v.user_id = auth.uid() AND auth.uid() IS NOT NULL)
        OR 
        (v.user_id IS NULL AND v.metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
    );
END;
$$;

-- Create function to vote for product
CREATE OR REPLACE FUNCTION vote_for_product(
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
    v_vote_count integer;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Validate vote type
    IF p_vote_type NOT IN (1, -1) THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either 1 or -1';
    END IF;

    -- For anonymous users, check vote limit
    IF v_user_id IS NULL THEN
        IF p_client_id IS NULL THEN
            RAISE EXCEPTION 'Client ID is required for anonymous voting';
        END IF;

        -- Check anonymous vote limit
        SELECT COUNT(*) INTO v_vote_count
        FROM votes
        WHERE user_id IS NULL 
        AND metadata->>'client_id' = p_client_id;

        IF v_vote_count >= 5 THEN
            RAISE EXCEPTION 'Anonymous vote limit reached';
        END IF;
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
    ELSIF v_existing_vote = p_vote_type THEN
        -- Remove vote if same type
        DELETE FROM votes
        WHERE product_id = p_product_id
        AND (
            (user_id = v_user_id AND v_user_id IS NOT NULL)
            OR
            (user_id IS NULL AND metadata->>'client_id' = p_client_id)
        );
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
    END IF;

    -- Refresh materialized views
    PERFORM refresh_product_rankings();

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'vote_type', p_vote_type
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_votes(uuid[], text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION vote_for_product(uuid, integer, text) TO authenticated, anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_votes_product_user ON votes(product_id, user_id);
CREATE INDEX IF NOT EXISTS idx_votes_client_id ON votes((metadata->>'client_id')) WHERE user_id IS NULL; 
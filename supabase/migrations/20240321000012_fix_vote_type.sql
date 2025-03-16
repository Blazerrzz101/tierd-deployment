-- Drop existing function
DROP FUNCTION IF EXISTS public.vote_for_product;

-- Create the vote function with proper parameter names
CREATE OR REPLACE FUNCTION public.vote_for_product(
    p_product_id uuid,
    p_vote_type text,
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
    v_new_vote_type integer;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Convert text vote type to integer
    v_new_vote_type := CASE p_vote_type
        WHEN 'up' THEN 1
        WHEN 'down' THEN -1
        ELSE NULL
    END;

    -- Validate vote type
    IF v_new_vote_type IS NULL THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either up or down';
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
            v_new_vote_type,
            CASE 
                WHEN v_user_id IS NULL THEN jsonb_build_object('client_id', p_client_id)
                ELSE '{}'::jsonb
            END
        );
    ELSIF v_existing_vote = v_new_vote_type THEN
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
        SET vote_type = v_new_vote_type,
            updated_at = now()
        WHERE product_id = p_product_id
        AND (
            (user_id = v_user_id AND v_user_id IS NOT NULL)
            OR
            (user_id IS NULL AND metadata->>'client_id' = p_client_id)
        );
    END IF;

    -- Refresh the rankings
    PERFORM refresh_product_rankings();

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'vote_type', p_vote_type
    );
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.vote_for_product(uuid, text, text) TO authenticated, anon;

-- Ensure votes table has proper structure
ALTER TABLE public.votes 
    ALTER COLUMN vote_type TYPE integer USING 
    CASE 
        WHEN vote_type = 'up' THEN 1
        WHEN vote_type = 'down' THEN -1
        ELSE NULL
    END,
    ADD CONSTRAINT vote_type_check CHECK (vote_type IN (1, -1));

-- Create index for vote lookups if they don't exist
CREATE INDEX IF NOT EXISTS idx_votes_product_user ON votes(product_id, user_id);
CREATE INDEX IF NOT EXISTS idx_votes_client_id ON votes((metadata->>'client_id')) WHERE user_id IS NULL; 
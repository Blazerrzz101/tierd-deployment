-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.vote_for_product(UUID, TEXT);
DROP FUNCTION IF EXISTS public.get_user_vote_count(UUID);
DROP FUNCTION IF EXISTS public.check_vote_limit(UUID);

-- Create function to get vote count for a client (user or client ID)
CREATE OR REPLACE FUNCTION public.get_vote_count(p_user_id UUID DEFAULT NULL, p_client_id TEXT DEFAULT NULL)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    IF p_user_id IS NOT NULL THEN
        -- Count authenticated user votes
        SELECT COUNT(*)
        INTO v_count
        FROM votes
        WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '24 hours';
    ELSE
        -- Count anonymous votes from client ID
        SELECT COUNT(*)
        INTO v_count
        FROM votes
        WHERE user_id IS NULL
        AND metadata->>'client_id' = p_client_id
        AND created_at > NOW() - INTERVAL '24 hours';
    END IF;
    
    RETURN COALESCE(v_count, 0);
END;
$$;

-- Create function to check vote limit
CREATE OR REPLACE FUNCTION public.check_vote_limit(p_user_id UUID DEFAULT NULL, p_client_id TEXT DEFAULT NULL)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_vote_count INTEGER;
    v_max_votes INTEGER;
BEGIN
    -- Get current vote count
    SELECT public.get_vote_count(p_user_id, p_client_id) INTO v_vote_count;
    
    -- Set max votes based on authentication status
    v_max_votes := CASE 
        WHEN p_user_id IS NOT NULL THEN 50  -- Authenticated users get 50 votes per day
        ELSE 5                              -- Anonymous users get 5 votes per day
    END;
    
    -- Return true if user has not reached limit
    RETURN v_vote_count < v_max_votes;
END;
$$;

-- Create the vote_for_product function
CREATE OR REPLACE FUNCTION public.vote_for_product(
    p_product_id UUID,
    p_vote_type TEXT,
    p_client_id TEXT DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote INTEGER;
    v_new_vote_type INTEGER;
    v_can_vote BOOLEAN;
BEGIN
    -- Get the current user ID if authenticated
    v_user_id := auth.uid();
    
    -- Convert text vote type to integer
    v_new_vote_type := CASE p_vote_type
        WHEN 'upvote' THEN 1
        WHEN 'downvote' THEN -1
        ELSE NULL
    END;

    -- Validate vote type
    IF v_new_vote_type IS NULL THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either upvote or downvote';
    END IF;

    -- Check vote limit
    SELECT public.check_vote_limit(v_user_id, p_client_id) INTO v_can_vote;
    IF NOT v_can_vote THEN
        RAISE EXCEPTION 'Vote limit reached';
    END IF;

    -- Check for existing vote
    IF v_user_id IS NOT NULL THEN
        -- Authenticated user vote
        SELECT vote_type INTO v_existing_vote
        FROM votes
        WHERE product_id = p_product_id AND user_id = v_user_id;
    ELSE
        -- Anonymous vote
        SELECT vote_type INTO v_existing_vote
        FROM votes
        WHERE product_id = p_product_id 
        AND user_id IS NULL 
        AND metadata->>'client_id' = p_client_id
        AND created_at > NOW() - INTERVAL '24 hours';
    END IF;

    -- Handle the vote
    IF v_existing_vote IS NULL THEN
        -- Insert new vote
        INSERT INTO votes (product_id, user_id, vote_type, metadata)
        VALUES (
            p_product_id, 
            v_user_id,
            v_new_vote_type,
            CASE 
                WHEN v_user_id IS NULL THEN 
                    jsonb_build_object('client_id', p_client_id)
                ELSE 
                    '{}'::jsonb
            END
        );
    ELSIF v_existing_vote = v_new_vote_type THEN
        -- Remove vote if clicking the same type again
        DELETE FROM votes
        WHERE product_id = p_product_id 
        AND (
            (user_id = v_user_id AND v_user_id IS NOT NULL) OR
            (user_id IS NULL AND metadata->>'client_id' = p_client_id)
        );
    ELSE
        -- Update vote if changing from upvote to downvote or vice versa
        UPDATE votes
        SET vote_type = v_new_vote_type,
            updated_at = now()
        WHERE product_id = p_product_id 
        AND (
            (user_id = v_user_id AND v_user_id IS NOT NULL) OR
            (user_id IS NULL AND metadata->>'client_id' = p_client_id)
        );
    END IF;

    -- Refresh the rankings
    PERFORM refresh_product_rankings();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_vote_count(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.check_vote_limit(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.vote_for_product(UUID, TEXT, TEXT) TO authenticated, anon;

-- Create trigger to track vote timestamps
CREATE OR REPLACE FUNCTION public.update_vote_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vote_timestamp
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_vote_timestamp();

-- Add index for vote counting
CREATE INDEX IF NOT EXISTS idx_votes_user_created_at 
ON votes(user_id, created_at);

-- Add index for anonymous vote tracking
CREATE INDEX IF NOT EXISTS idx_votes_anonymous_client 
ON votes((metadata->>'client_id')) 
WHERE user_id IS NULL; 
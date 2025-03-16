-- Drop the existing function
DROP FUNCTION IF EXISTS public.handle_vote;

-- Recreate the function with simplified hashing
CREATE OR REPLACE FUNCTION public.handle_vote(
    p_product_id UUID,
    p_vote_type TEXT,
    p_anonymous_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_vote_value INTEGER;
    v_result JSONB;
    v_is_active BOOLEAN;
BEGIN
    -- Get current user if authenticated
    v_user_id := auth.uid();
    
    -- Convert vote type to integer
    v_vote_value := CASE 
        WHEN p_vote_type = 'upvote' THEN 1
        WHEN p_vote_type = 'downvote' THEN -1
        ELSE NULL
    END;

    -- Validate vote type
    IF v_vote_value IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid vote type. Must be upvote or downvote.'
        );
    END IF;

    -- Check if product exists
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found.'
        );
    END IF;

    -- Handle authenticated user vote
    IF v_user_id IS NOT NULL THEN
        -- Check if user is active
        SELECT public.is_user_active(v_user_id) INTO v_is_active;
        
        IF NOT v_is_active THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Account is inactive. Please verify your email or contact support.'
            );
        END IF;

        -- Insert or update vote
        INSERT INTO public.votes (product_id, user_id, vote_type)
        VALUES (p_product_id, v_user_id, v_vote_value)
        ON CONFLICT (product_id, user_id) 
        DO UPDATE SET 
            vote_type = EXCLUDED.vote_type,
            updated_at = NOW()
        RETURNING jsonb_build_object(
            'success', true,
            'vote_id', id::text,
            'vote_type', vote_type,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_result;

        -- Log activity
        PERFORM public.log_user_activity(
            'vote',
            jsonb_build_object(
                'product_id', p_product_id,
                'vote_type', p_vote_type
            )
        );

        RETURN v_result;
    END IF;

    -- Handle anonymous vote
    IF p_anonymous_id IS NOT NULL THEN
        -- Check rate limit
        IF NOT EXISTS (
            SELECT 1
            FROM public.votes
            WHERE metadata->>'anonymous_id' = p_anonymous_id
            AND created_at > NOW() - INTERVAL '1 hour'
            HAVING COUNT(*) < 5
        ) THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Rate limit exceeded. Please try again later.'
            );
        END IF;

        -- Insert anonymous vote with minimal metadata
        INSERT INTO public.votes (
            product_id,
            vote_type,
            metadata
        )
        VALUES (
            p_product_id,
            v_vote_value,
            jsonb_build_object(
                'anonymous_id', p_anonymous_id,
                'ip', current_setting('request.headers')::json->>'x-real-ip'
            )
        )
        RETURNING jsonb_build_object(
            'success', true,
            'vote_id', id::text,
            'vote_type', vote_type,
            'created_at', created_at
        ) INTO v_result;

        RETURN v_result;
    END IF;

    RETURN jsonb_build_object(
        'success', false,
        'message', 'Authentication required.'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.handle_vote TO anon, authenticated; 
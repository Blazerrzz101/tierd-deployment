-- Drop existing functions
DROP FUNCTION IF EXISTS public.vote_for_product(uuid, text, text);
DROP FUNCTION IF EXISTS public.vote_for_product(uuid, integer, text);

-- Create improved vote function
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
    v_vote_count integer;
    v_product_name text;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Validate vote type
    IF p_vote_type NOT IN (1, -1) THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either 1 or -1';
    END IF;

    -- Get product name for activity log
    SELECT name INTO v_product_name FROM products WHERE id = p_product_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
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

        -- Log activity for authenticated users
        IF v_user_id IS NOT NULL THEN
            INSERT INTO activities (user_id, type, details)
            VALUES (
                v_user_id,
                'vote',
                jsonb_build_object(
                    'action', 'created',
                    'product_id', p_product_id,
                    'product_name', v_product_name,
                    'vote_type', p_vote_type
                )
            );
        END IF;

    ELSIF v_existing_vote = p_vote_type THEN
        -- Remove vote if same type
        DELETE FROM votes
        WHERE product_id = p_product_id
        AND (
            (user_id = v_user_id AND v_user_id IS NOT NULL)
            OR
            (user_id IS NULL AND metadata->>'client_id' = p_client_id)
        );

        -- Log activity for authenticated users
        IF v_user_id IS NOT NULL THEN
            INSERT INTO activities (user_id, type, details)
            VALUES (
                v_user_id,
                'vote',
                jsonb_build_object(
                    'action', 'removed',
                    'product_id', p_product_id,
                    'product_name', v_product_name,
                    'vote_type', p_vote_type
                )
            );
        END IF;

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

        -- Log activity for authenticated users
        IF v_user_id IS NOT NULL THEN
            INSERT INTO activities (user_id, type, details)
            VALUES (
                v_user_id,
                'vote',
                jsonb_build_object(
                    'action', 'updated',
                    'product_id', p_product_id,
                    'product_name', v_product_name,
                    'vote_type', p_vote_type
                )
            );
        END IF;
    END IF;

    -- Refresh materialized views
    PERFORM refresh_product_rankings();

    -- Return success response
    RETURN jsonb_build_object(
        'success', true,
        'vote_type', p_vote_type,
        'product_name', v_product_name
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION vote_for_product(uuid, integer, text) TO authenticated, anon;

-- Create function to get user activity
CREATE OR REPLACE FUNCTION get_user_activity(p_user_id uuid)
RETURNS TABLE (
    id uuid,
    type text,
    details jsonb,
    created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.type,
        a.details,
        a.created_at
    FROM activities a
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_activity(uuid) TO authenticated; 
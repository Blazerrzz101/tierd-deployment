-- Function to check remaining votes for a client
CREATE OR REPLACE FUNCTION public.get_remaining_client_votes(
    p_client_id text,
    p_max_votes integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_votes integer;
    v_remaining_votes integer;
BEGIN
    -- Count votes by this client in the last 24 hours
    SELECT COUNT(*)
    INTO v_total_votes
    FROM votes
    WHERE 
        metadata->>'client_id' = p_client_id
        AND user_id IS NULL
        AND created_at > (NOW() - INTERVAL '24 hours');
    
    -- Calculate remaining votes
    v_remaining_votes := GREATEST(0, p_max_votes - v_total_votes);
    
    -- Return the result
    RETURN jsonb_build_object(
        'remaining_votes', v_remaining_votes,
        'total_votes', v_total_votes,
        'max_votes', p_max_votes
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'remaining_votes', 0,
            'total_votes', 0,
            'max_votes', p_max_votes,
            'error', SQLERRM
        );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_remaining_client_votes(text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_remaining_client_votes(text, integer) TO anon; 
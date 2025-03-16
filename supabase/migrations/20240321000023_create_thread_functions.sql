-- Create threads table
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create thread votes table
CREATE TABLE IF NOT EXISTS public.thread_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(thread_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_created ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_votes_thread ON thread_votes(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_votes_user ON thread_votes(user_id);

-- Create function to vote on thread
CREATE OR REPLACE FUNCTION public.vote_for_thread(
    p_thread_id UUID,
    p_vote_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote TEXT;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate vote type
    IF p_vote_type NOT IN ('up', 'down') THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either up or down';
    END IF;

    -- Check for existing vote
    SELECT vote_type INTO v_existing_vote
    FROM thread_votes
    WHERE thread_id = p_thread_id AND user_id = v_user_id;

    -- Handle the vote
    IF v_existing_vote IS NULL THEN
        -- Insert new vote
        INSERT INTO thread_votes (thread_id, user_id, vote_type)
        VALUES (p_thread_id, v_user_id, p_vote_type);
    ELSIF v_existing_vote = p_vote_type THEN
        -- Remove vote if clicking the same type again
        DELETE FROM thread_votes
        WHERE thread_id = p_thread_id AND user_id = v_user_id;
    ELSE
        -- Update vote if changing from up to down or vice versa
        UPDATE thread_votes
        SET vote_type = p_vote_type,
            updated_at = now()
        WHERE thread_id = p_thread_id AND user_id = v_user_id;
    END IF;

    -- Log activity
    PERFORM public.log_activity(
        v_user_id,
        'vote',
        jsonb_build_object(
            'thread_id', p_thread_id,
            'vote_type', p_vote_type
        )
    );
END;
$$;

-- Create function to get thread votes
CREATE OR REPLACE FUNCTION public.get_thread_votes(p_thread_ids UUID[])
RETURNS TABLE (
    thread_id UUID,
    upvotes BIGINT,
    downvotes BIGINT,
    user_vote TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH vote_counts AS (
        SELECT 
            tv.thread_id,
            COUNT(*) FILTER (WHERE tv.vote_type = 'up') as upvotes,
            COUNT(*) FILTER (WHERE tv.vote_type = 'down') as downvotes
        FROM thread_votes tv
        WHERE tv.thread_id = ANY(p_thread_ids)
        GROUP BY tv.thread_id
    ),
    user_votes AS (
        SELECT 
            tv.thread_id,
            tv.vote_type as user_vote
        FROM thread_votes tv
        WHERE tv.thread_id = ANY(p_thread_ids)
        AND tv.user_id = auth.uid()
    )
    SELECT 
        t.id as thread_id,
        COALESCE(vc.upvotes, 0) as upvotes,
        COALESCE(vc.downvotes, 0) as downvotes,
        uv.user_vote
    FROM unnest(p_thread_ids) WITH ORDINALITY as t(id, ord)
    LEFT JOIN vote_counts vc ON vc.thread_id = t.id
    LEFT JOIN user_votes uv ON uv.thread_id = t.id
    ORDER BY t.ord;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.threads TO authenticated;
GRANT ALL ON public.thread_votes TO authenticated;
GRANT EXECUTE ON FUNCTION public.vote_for_thread(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_thread_votes(UUID[]) TO authenticated; 
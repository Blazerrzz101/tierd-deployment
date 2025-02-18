-- Enable better error reporting
SET client_min_messages TO notice;

-- Create extension for IP-based rate limiting in the public schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;

-- Grant access to public schema and tables
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO anon, authenticated;

-- Modify votes table to allow anonymous votes
ALTER TABLE public.votes ALTER COLUMN user_id DROP NOT NULL;

-- Add metadata column to votes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'votes' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.votes ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- Create function to handle anonymous votes with rate limiting
CREATE OR REPLACE FUNCTION public.handle_anonymous_vote(
    product_id UUID,
    vote_type TEXT,
    ip_address TEXT
) RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    rate_limit_key TEXT;
    rate_limit_period INTERVAL := INTERVAL '1 hour';
    max_votes_per_period INTEGER := 5;
    current_votes INTEGER;
    vote_value INTEGER;
BEGIN
    -- Convert vote_type to integer
    vote_value := CASE 
        WHEN vote_type = 'upvote' THEN 1
        WHEN vote_type = 'downvote' THEN -1
        ELSE NULL
    END;

    -- Validate vote_type
    IF vote_value IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Generate a rate limit key from IP address using MD5
    rate_limit_key := md5(ip_address);
    
    -- Check vote count for this IP in the last period
    SELECT COUNT(*)
    INTO current_votes
    FROM public.votes
    WHERE metadata->>'rate_limit_key' = rate_limit_key
    AND created_at > NOW() - rate_limit_period;
    
    -- If under rate limit, allow vote
    IF current_votes < max_votes_per_period THEN
        INSERT INTO public.votes (product_id, vote_type, metadata)
        VALUES (
            product_id,
            vote_value,
            jsonb_build_object('rate_limit_key', rate_limit_key)
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Add comment for the function
COMMENT ON FUNCTION public.handle_anonymous_vote IS 'Handles anonymous voting with IP-based rate limiting';

-- Grant execute permission on handle_anonymous_vote function
GRANT EXECUTE ON FUNCTION public.handle_anonymous_vote(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.handle_anonymous_vote(UUID, TEXT, TEXT) TO authenticated;

-- Drop existing vote policies
DROP POLICY IF EXISTS "Allow authenticated users to create votes" ON public.votes;
DROP POLICY IF EXISTS "Allow users to update their own votes" ON public.votes;
DROP POLICY IF EXISTS "Allow users to delete their own votes" ON public.votes;
DROP POLICY IF EXISTS "Allow users to read all votes" ON public.votes;

-- Create updated RLS policies for votes
CREATE POLICY "Votes are viewable by everyone"
ON public.votes FOR SELECT
TO public
USING (true);

CREATE POLICY "Anonymous users can vote with rate limiting"
ON public.votes FOR INSERT
TO public
WITH CHECK (
    user_id IS NULL AND
    EXISTS (
        SELECT 1
        FROM handle_anonymous_vote(
            product_id::UUID,
            vote_type::TEXT,
            current_setting('request.headers')::json->>'x-real-ip'
        )
        WHERE handle_anonymous_vote = true
    )
);

CREATE POLICY "Authenticated users can vote"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
ON public.votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
ON public.votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to handle authenticated votes with improved error handling
CREATE OR REPLACE FUNCTION public.handle_authenticated_vote(
    p_product_id UUID,
    p_vote_type TEXT,
    p_user_id UUID
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_vote_value INTEGER;
    v_result JSONB;
BEGIN
    -- Convert vote_type to integer
    v_vote_value := CASE 
        WHEN p_vote_type = 'upvote' THEN 1
        WHEN p_vote_type = 'downvote' THEN -1
        ELSE NULL
    END;

    -- Validate vote_type
    IF v_vote_value IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid vote type. Must be upvote or downvote.'
        );
    END IF;

    -- Validate product exists
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found.'
        );
    END IF;

    BEGIN
        -- Insert or update vote
        INSERT INTO public.votes (product_id, user_id, vote_type)
        VALUES (p_product_id, p_user_id, v_vote_value)
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

        RETURN v_result;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', SQLERRM
            );
    END;
END;
$$;

-- Grant execute permission on handle_authenticated_vote function
GRANT EXECUTE ON FUNCTION public.handle_authenticated_vote(UUID, TEXT, UUID) TO authenticated;

-- Add comment for the function
COMMENT ON FUNCTION public.handle_authenticated_vote IS 'Handles authenticated voting with improved error handling';

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT
TO public
USING (true);

CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
TO public
USING (true);
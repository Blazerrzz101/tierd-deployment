-- Reset permissions for public schema
DO $$ 
BEGIN
    -- Revoke existing permissions
    EXECUTE 'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon';
    EXECUTE 'REVOKE ALL ON SCHEMA public FROM anon';

    -- Grant schema usage
    EXECUTE 'GRANT USAGE ON SCHEMA public TO anon';

    -- Grant table access
    EXECUTE 'GRANT SELECT ON public.products TO anon';
    EXECUTE 'GRANT SELECT ON public.votes TO anon';
    EXECUTE 'GRANT SELECT ON public.product_rankings TO anon';
END $$;

-- Create anonymous vote handling function
CREATE OR REPLACE FUNCTION handle_anonymous_vote(
    p_product_id UUID,
    p_vote_type TEXT,
    p_ip_address TEXT
) RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_vote_count INTEGER;
    v_last_vote_time TIMESTAMPTZ;
    v_hashed_ip TEXT;
BEGIN
    -- Hash the IP address for privacy
    v_hashed_ip := encode(digest(p_ip_address, 'sha256'), 'hex');
    
    -- Check rate limit (5 votes per hour)
    SELECT COUNT(*), MAX(created_at)
    INTO v_vote_count, v_last_vote_time
    FROM votes
    WHERE user_id IS NULL
    AND metadata->>'hashed_ip' = v_hashed_ip
    AND created_at > NOW() - INTERVAL '1 hour';
    
    IF v_vote_count >= 5 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;

-- Enable RLS on tables (not views)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;

-- Create policies
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
TO public
USING (true);

CREATE POLICY "Votes are viewable by everyone" 
ON public.votes FOR SELECT 
TO public
USING (true);

-- Allow anonymous voting with rate limiting
CREATE POLICY "Anonymous users can vote with rate limiting"
ON public.votes FOR INSERT
TO public
WITH CHECK (
    user_id IS NULL AND
    EXISTS (
        SELECT 1
        FROM handle_anonymous_vote(
            product_id,
            vote_type::text,
            current_setting('request.headers')::json->>'x-real-ip'
        )
        WHERE handle_anonymous_vote = true
    )
);

-- Verify permissions
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('products', 'votes');

-- Verify grants
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('products', 'votes', 'product_rankings')
AND grantee = 'anon'; 
-- Reset permissions for public schema
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON SCHEMA public FROM anon;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table access
GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.product_rankings TO anon;
GRANT SELECT ON public.votes TO anon;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Rankings are viewable by everyone" ON public.product_rankings;
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.votes;

-- Create policies
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
TO public
USING (true);

CREATE POLICY "Rankings are viewable by everyone" 
ON public.product_rankings FOR SELECT 
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
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE grantee = 'anon'
AND table_schema = 'public'
ORDER BY table_schema, table_name; 
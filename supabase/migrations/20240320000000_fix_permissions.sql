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

-- Enable RLS on tables (not views)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Drop and recreate product policies
DO $$ 
DECLARE
    policy_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' 
        AND policyname = 'Products are viewable by everyone'
    ) INTO policy_exists;

    IF policy_exists THEN
        DROP POLICY "Products are viewable by everyone" ON public.products;
    END IF;
END $$;

-- Create product policies
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
TO public
USING (true);

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
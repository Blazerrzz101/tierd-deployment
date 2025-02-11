-- Grant schema usage to anonymous users
GRANT USAGE ON SCHEMA public TO anon;

-- Grant table permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Make sure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_rankings;

-- Create policies that allow anyone to read products
CREATE POLICY "Enable read access for all users" ON public.products
    FOR SELECT
    USING (true);

-- Create policies that allow anyone to read rankings
CREATE POLICY "Enable read access for all users" ON public.product_rankings
    FOR SELECT
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
WHERE tablename IN ('products', 'product_rankings');

-- Verify grants
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('products', 'product_rankings')
AND grantee = 'anon'; 
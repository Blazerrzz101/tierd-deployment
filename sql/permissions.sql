-- Reset permissions
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, service_role;
REVOKE ALL ON SCHEMA public FROM anon, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, service_role;

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, service_role;

-- Grant table access
GRANT SELECT ON public.products TO anon, service_role;
GRANT SELECT ON public.product_rankings TO anon, service_role;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Rankings are viewable by everyone" ON public.product_rankings;

-- Create policies
CREATE POLICY "Products are viewable by everyone" 
ON public.products FOR SELECT 
TO anon, service_role
USING (true);

CREATE POLICY "Rankings are viewable by everyone" 
ON public.product_rankings FOR SELECT 
TO anon, service_role
USING (true);

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO anon, service_role;

-- Verify permissions
SELECT grantee, table_schema, table_name, privilege_type
FROM information_schema.role_table_grants 
WHERE grantee IN ('anon', 'service_role')
AND table_schema = 'public'
ORDER BY table_schema, table_name;

-- Verify RLS is enabled
SELECT schemaname, tablename, hasrowsecurity, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND (tablename = 'products' OR tablename = 'product_rankings');

-- Verify policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND (tablename = 'products' OR tablename = 'product_rankings'); 
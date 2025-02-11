-- Reset and grant all necessary schema permissions
REVOKE ALL ON SCHEMA public FROM anon;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Ensure RLS is properly configured
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;

-- Recreate policies with explicit permissions
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_rankings;

CREATE POLICY "Enable read access for all users" ON public.products
    FOR SELECT
    USING (true);

CREATE POLICY "Enable read access for all users" ON public.product_rankings
    FOR SELECT
    USING (true);

-- Create default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO anon;

-- Verify schema permissions
SELECT 
    nspname as schema_name,
    proacl as access_privileges
FROM pg_namespace n
JOIN pg_proc p ON p.pronamespace = n.oid
WHERE nspname = 'public';

-- Verify table permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    string_agg(privilege_type, ', ') as privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
AND grantee = 'anon'
GROUP BY grantee, table_schema, table_name;

-- Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'; 
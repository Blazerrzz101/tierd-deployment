-- Test anonymous access to products
SET SESSION ROLE anon;

-- Try to select from products
SELECT 
    id,
    name,
    url_slug
FROM products
LIMIT 1;

-- Show current permissions
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'products'
AND grantee IN ('anon', 'authenticated');

-- Show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'products'; 
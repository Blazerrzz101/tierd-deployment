-- 1. Verify product data integrity
SELECT 
    p.id,
    p.name,
    p.url_slug,
    p.description,
    p.price,
    p.category,
    p.image_url,
    p.details,
    p.metadata,
    pr.upvotes,
    pr.downvotes,
    pr.net_score,
    pr.rank
FROM public.products p
LEFT JOIN public.product_rankings pr ON p.id = pr.product_id
WHERE p.name = 'Logitech G Pro X Superlight';

-- 2. Verify URL slug uniqueness
SELECT url_slug, COUNT(*) as count
FROM public.products
GROUP BY url_slug
HAVING COUNT(*) > 1;

-- 3. Verify RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('products', 'product_rankings');

-- 4. Verify table permissions for anonymous access
SELECT 
    grantee,
    table_schema,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE table_name IN ('products', 'product_rankings')
AND grantee = 'anon';

-- 5. Verify required columns for frontend
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;

-- 6. Test product search by URL slug
SELECT EXISTS (
    SELECT 1
    FROM public.products
    WHERE url_slug = 'logitech-g-pro-x-superlight'
) as product_exists;

-- 7. Verify no orphaned rankings
SELECT COUNT(*) as orphaned_rankings
FROM public.product_rankings pr
WHERE NOT EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = pr.product_id
); 
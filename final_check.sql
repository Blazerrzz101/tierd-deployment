-- Final verification of the Logitech product setup
WITH product_check AS (
    SELECT 
        'Product Data' as check_type,
        CASE 
            WHEN COUNT(*) = 1 THEN '✓ One product exists'
            ELSE '✗ Wrong number of products: ' || COUNT(*)::text
        END as status
    FROM public.products 
    WHERE name = 'Logitech G Pro X Superlight'
    UNION ALL
    SELECT 
        'URL Slug',
        CASE 
            WHEN url_slug = 'logitech-g-pro-x-superlight' THEN '✓ Correct URL slug'
            ELSE '✗ Wrong URL slug: ' || url_slug
        END
    FROM public.products 
    WHERE name = 'Logitech G Pro X Superlight'
    UNION ALL
    SELECT 
        'Rankings',
        CASE 
            WHEN COUNT(*) = 1 THEN '✓ Rankings exist'
            ELSE '✗ Missing rankings'
        END
    FROM public.product_rankings pr
    JOIN public.products p ON p.id = pr.product_id
    WHERE p.name = 'Logitech G Pro X Superlight'
    UNION ALL
    SELECT
        'RLS Policy',
        CASE 
            WHEN COUNT(*) > 0 THEN '✓ RLS policy exists'
            ELSE '✗ Missing RLS policy'
        END
    FROM pg_policies 
    WHERE tablename = 'products'
    AND policyname = 'Enable read access for all users'
)
SELECT * FROM product_check;

-- Show complete product data
SELECT 
    p.id,
    p.name,
    p.url_slug,
    p.description,
    p.price,
    p.category,
    p.image_url,
    pr.upvotes,
    pr.downvotes,
    pr.net_score,
    pr.rank
FROM public.products p
LEFT JOIN public.product_rankings pr ON p.id = pr.product_id
WHERE p.name = 'Logitech G Pro X Superlight'; 
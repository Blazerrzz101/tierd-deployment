-- Health Check SQL for Backend Integration
-- Run each section separately to check different aspects of the system

-- 1. Check if all required tables exist and their structure
SELECT 
    table_name,
    EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = t.table_name
    ) as table_exists
FROM (
    VALUES 
        ('products'),
        ('votes'),
        ('reviews'),
        ('categories'),
        ('product_rankings')
) as t(table_name);

-- 2. Verify RLS policies are in place
SELECT 
    policies.tablename as table_name,
    policies.policyname,
    policies.permissive,
    policies.roles,
    policies.cmd
FROM pg_policies policies
JOIN pg_class tables ON policies.tablename = tables.relname
WHERE tables.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY policies.tablename, policies.policyname;

-- 3. Check if the product_rankings materialized view is working
SELECT EXISTS (
    SELECT 1 
    FROM pg_matviews 
    WHERE schemaname = 'public' 
    AND matviewname = 'product_rankings'
) as rankings_view_exists;

-- 4. Verify trigger for rankings refresh exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'refresh_rankings_on_vote';

-- 5. Sample data verification
-- Check if we have products with proper structure
SELECT 
    id,
    name,
    url_slug,
    image_url IS NOT NULL as has_image,
    details IS NOT NULL as has_details,
    metadata IS NOT NULL as has_metadata,
    created_at IS NOT NULL as has_timestamps
FROM products
LIMIT 5;

-- 6. Check if the voting system is properly set up
SELECT 
    v.vote_type,
    COUNT(*) as vote_count,
    COUNT(DISTINCT v.product_id) as products_with_votes,
    COUNT(DISTINCT v.user_id) as unique_voters
FROM votes v
GROUP BY v.vote_type;

-- 7. Verify category setup
SELECT 
    c.id,
    c.name,
    COUNT(p.id) as product_count
FROM categories c
LEFT JOIN products p ON p.category = c.id
GROUP BY c.id, c.name;

-- 8. Check review system
SELECT 
    COUNT(*) as total_reviews,
    AVG(rating) as avg_rating,
    COUNT(DISTINCT product_id) as products_with_reviews,
    COUNT(DISTINCT user_id) as unique_reviewers
FROM reviews;

-- 9. Verify function existence
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'refresh_product_rankings',
    'handle_vote_update',
    'update_product_score'
);

-- 10. Check permissions for anonymous users
SELECT 
    table_name,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants
WHERE grantee = 'anon'
AND table_schema = 'public'
ORDER BY table_name, privilege_type;

-- 11. Verify product details structure
SELECT 
    id,
    name,
    jsonb_object_keys(details) as detail_keys,
    jsonb_typeof(details->'images') as images_type,
    jsonb_array_length(
        CASE WHEN jsonb_typeof(details->'images') = 'array' 
        THEN details->'images' 
        ELSE '[]'::jsonb 
        END
    ) as image_count
FROM products
WHERE details IS NOT NULL
LIMIT 5;

-- 12. Check integration with frontend requirements
SELECT 
    p.id,
    p.name,
    p.image_url,
    p.details,
    p.metadata,
    EXISTS(
        SELECT 1 FROM votes v 
        WHERE v.product_id = p.id
    ) as has_votes,
    EXISTS(
        SELECT 1 FROM reviews r 
        WHERE r.product_id = p.id
    ) as has_reviews,
    (
        SELECT json_build_object(
            'upvotes', COUNT(*) FILTER (WHERE v.vote_type = 'up'),
            'downvotes', COUNT(*) FILTER (WHERE v.vote_type = 'down')
        )
        FROM votes v
        WHERE v.product_id = p.id
    ) as vote_counts
FROM products p
LIMIT 3; 
-- Check if tables exist
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('threads', 'thread_products', 'thread_votes', 'thread_comments')
ORDER BY table_name, ordinal_position;

-- Check if triggers exist
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table IN ('thread_votes', 'thread_comments');

-- Check if RLS is enabled
SELECT 
    tablename,
    relrowsecurity as has_rls
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname AND t.schemaname = c.relnamespace::regnamespace::text
WHERE t.schemaname = 'public'
  AND t.tablename IN ('threads', 'thread_products', 'thread_votes', 'thread_comments');

-- Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('threads', 'thread_products', 'thread_votes', 'thread_comments'); 
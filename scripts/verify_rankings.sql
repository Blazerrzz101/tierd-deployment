-- Verification Script for Tier'd Ranking System

DO $$
BEGIN
    RAISE NOTICE E'\n==== STARTING VERIFICATION SCRIPT ====\n';
END $$;

-- 1. Check if the required tables and views exist
DO $$
BEGIN
    RAISE NOTICE E'\n=== [1/14] Table and View Verification ===';
    
    -- Check if product_votes table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_votes'
    ) THEN
        RAISE NOTICE 'ERROR: product_votes table does not exist';
    ELSE
        RAISE NOTICE 'OK: product_votes table exists';
    END IF;

    -- Check if product_rankings view exists
    IF NOT EXISTS (
        SELECT FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'product_rankings'
    ) THEN
        RAISE NOTICE 'ERROR: product_rankings view does not exist';
    ELSE
        RAISE NOTICE 'OK: product_rankings view exists';
    END IF;
    
    RAISE NOTICE 'Section 1 complete.';
END $$;

-- 2. Verify the votes table structure
DO $$
DECLARE
    col record;
    col_count integer := 0;
BEGIN
    RAISE NOTICE E'\n=== [2/14] Table Structure ===';
    FOR col IN
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'product_votes'
    LOOP
        RAISE NOTICE 'Column: %, Type: %, Nullable: %', 
            col.column_name, 
            col.data_type, 
            col.is_nullable;
        col_count := col_count + 1;
    END LOOP;
    
    IF col_count = 0 THEN
        RAISE NOTICE 'WARNING: No columns found in product_votes table';
    ELSE
        RAISE NOTICE 'Found % columns in product_votes table', col_count;
    END IF;
    
    RAISE NOTICE 'Section 2 complete.';
END $$;

-- 3. Check if the ranking trigger exists
DO $$
BEGIN
    RAISE NOTICE E'\n=== [3/14] Trigger Verification ===';
    IF NOT EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_name = 'update_rankings'
    ) THEN
        RAISE NOTICE 'ERROR: update_rankings trigger does not exist';
    ELSE
        RAISE NOTICE 'OK: update_rankings trigger exists';
    END IF;
    
    RAISE NOTICE 'Section 3 complete.';
END $$;

-- 4. Test vote counting
DO $$
DECLARE
    r record;
BEGIN
    RAISE NOTICE E'\n=== [4/14] Vote Count Verification ===';
    FOR r IN
        WITH test_counts AS (
            SELECT 
                product_id,
                COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
                COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes,
                COUNT(*) FILTER (WHERE vote_type = 'up') - COUNT(*) FILTER (WHERE vote_type = 'down') as score
            FROM product_votes
            GROUP BY product_id
        )
        SELECT 
            p.name as product_name,
            tc.upvotes,
            tc.downvotes,
            tc.score,
            DENSE_RANK() OVER (ORDER BY tc.score DESC) as calculated_rank,
            CASE 
                WHEN tc.score = pr.score THEN 'OK'
                ELSE 'MISMATCH'
            END as vote_count_check
        FROM test_counts tc
        JOIN products p ON p.id = tc.product_id
        JOIN product_rankings pr ON pr.id = tc.product_id
    LOOP
        RAISE NOTICE 'Product: %, Upvotes: %, Downvotes: %, Score: %, Rank: %, Status: %',
            r.product_name, r.upvotes, r.downvotes, r.score, r.calculated_rank, r.vote_count_check;
    END LOOP;
    
    RAISE NOTICE 'Section 4 complete.';
END $$;

-- 5. Verify ranking order
DO $$
DECLARE
    r record;
BEGIN
    RAISE NOTICE E'\n=== [5/14] Ranking Order Verification ===';
    FOR r IN
        WITH ranked_products AS (
            SELECT 
                p.name,
                p.id,
                pr.score,
                DENSE_RANK() OVER (ORDER BY pr.score DESC) as calculated_rank
            FROM product_rankings pr
            JOIN products p ON p.id = pr.id
        )
        SELECT 
            name,
            score,
            calculated_rank,
            CASE 
                WHEN calculated_rank = DENSE_RANK() OVER (ORDER BY score DESC) THEN 'OK'
                ELSE 'MISMATCH'
            END as rank_check
        FROM ranked_products
        ORDER BY score DESC
    LOOP
        RAISE NOTICE 'Product: %, Score: %, Rank: %, Status: %',
            r.name, r.score, r.calculated_rank, r.rank_check;
    END LOOP;
    
    RAISE NOTICE 'Section 5 complete.';
END $$;

-- 6. Check for orphaned votes
DO $$
DECLARE
    orphaned_count integer;
BEGIN
    RAISE NOTICE E'\n=== [6/14] Orphaned Votes Check ===';
    SELECT COUNT(*) INTO orphaned_count
    FROM product_votes v
    LEFT JOIN products p ON p.id = v.product_id
    WHERE p.id IS NULL;

    IF orphaned_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % orphaned votes', orphaned_count;
    ELSE
        RAISE NOTICE 'OK: No orphaned votes found';
    END IF;
    
    RAISE NOTICE 'Section 6 complete.';
END $$;

-- 7. Verify user vote constraints
DO $$
DECLARE
    r record;
    total_votes integer;
    unique_votes integer;
BEGIN
    RAISE NOTICE E'\n=== [7/14] Vote Constraints Check ===';
    
    -- Get total number of votes
    SELECT COUNT(*) INTO total_votes FROM product_votes;
    RAISE NOTICE 'Total votes in system: %', total_votes;
    
    -- Get number of unique user-product combinations
    SELECT COUNT(*) INTO unique_votes 
    FROM (
        SELECT DISTINCT product_id, user_id 
        FROM product_votes
    ) unique_combinations;
    RAISE NOTICE 'Unique user-product combinations: %', unique_votes;
    
    -- Check for any duplicate votes
    FOR r IN
        WITH vote_counts AS (
            SELECT 
                product_id,
                user_id,
                COUNT(*) as vote_count,
                array_agg(vote_type) as vote_types,
                array_agg(created_at) as vote_times
            FROM product_votes
            GROUP BY product_id, user_id
            HAVING COUNT(*) > 1
        )
        SELECT 
            p.name as product_name,
            vc.user_id,
            vc.vote_count,
            vc.vote_types,
            vc.vote_times
        FROM vote_counts vc
        JOIN products p ON p.id = vc.product_id
        ORDER BY vc.vote_count DESC
    LOOP
        RAISE NOTICE 'VIOLATION FOUND:';
        RAISE NOTICE '  Product: %', r.product_name;
        RAISE NOTICE '  User ID: %', r.user_id;
        RAISE NOTICE '  Vote Count: %', r.vote_count;
        RAISE NOTICE '  Vote Types: %', r.vote_types;
        RAISE NOTICE '  Vote Times: %', r.vote_times;
    END LOOP;

    -- If no violations found, show explicit success message
    IF NOT FOUND THEN
        IF total_votes = 0 THEN
            RAISE NOTICE 'NOTE: No votes found in the system';
        ELSIF total_votes = unique_votes THEN
            RAISE NOTICE 'OK: All votes are unique (% total votes)', total_votes;
        ELSE
            RAISE NOTICE 'WARNING: Vote counts mismatch - Total: %, Unique: %', total_votes, unique_votes;
        END IF;
    END IF;
    
    RAISE NOTICE 'Section 7 complete.';
END $$;

-- 8. Test materialized view refresh
DO $$
DECLARE
    view_size text;
    last_refresh timestamp;
    refresh_age interval;
BEGIN
    RAISE NOTICE E'\n=== [8/14] View Refresh Status ===';
    
    -- Get view size
    SELECT pg_size_pretty(pg_relation_size('product_rankings'::regclass)) INTO view_size;
    
    -- Get last refresh time and age
    SELECT pg_stat_get_last_autoanalyze_time('product_rankings'::regclass) INTO last_refresh;
    
    IF last_refresh IS NOT NULL THEN
        refresh_age := now() - last_refresh;
        
        RAISE NOTICE 'View size: %', view_size;
        RAISE NOTICE 'Last refresh: %', last_refresh;
        RAISE NOTICE 'Age: %', refresh_age;
            
        IF refresh_age > interval '1 hour' THEN
            RAISE NOTICE 'WARNING: View might be stale (last refresh was % ago)', refresh_age;
        END IF;
    ELSE
        RAISE NOTICE 'WARNING: Cannot determine last refresh time';
    END IF;
    
    RAISE NOTICE 'Section 8 complete.';
END $$;

-- 9. Category-specific rankings
DO $$
DECLARE
    r record;
BEGIN
    RAISE NOTICE E'\n=== [9/14] Category Rankings ===';
    FOR r IN
        SELECT 
            p.category,
            p.name as product_name,
            pr.score,
            DENSE_RANK() OVER (PARTITION BY p.category ORDER BY pr.score DESC) as category_rank
        FROM products p
        JOIN product_rankings pr ON pr.id = p.id
        ORDER BY p.category, pr.score DESC
    LOOP
        RAISE NOTICE 'Category: %, Product: %, Score: %, Rank: %',
            r.category, r.product_name, r.score, r.category_rank;
    END LOOP;
    
    RAISE NOTICE 'Section 9 complete.';
END $$;

-- 10. Verify rate limiting
DO $$
DECLARE
    rate_limit_count integer;
BEGIN
    RAISE NOTICE E'\n=== [10/14] Rate Limiting Check ===';
    SELECT COUNT(*) INTO rate_limit_count
    FROM (
        SELECT user_id, COUNT(*) as votes_last_hour
        FROM product_votes
        WHERE created_at >= (now() - interval '1 hour')
        GROUP BY user_id
        HAVING COUNT(*) > 50
    ) excessive_votes;

    IF rate_limit_count > 0 THEN
        RAISE NOTICE 'WARNING: % users exceeded vote rate limit in the last hour', rate_limit_count;
    ELSE
        RAISE NOTICE 'OK: No rate limit violations';
    END IF;
    
    RAISE NOTICE 'Section 10 complete.';
END $$;

-- 11. Check anonymous votes
DO $$
DECLARE
    anon_vote_count integer;
    anon_product_count integer;
BEGIN
    RAISE NOTICE E'\n=== [11/14] Anonymous Votes Status ===';
    -- Get counts for votes where user_id is null (anonymous)
    SELECT COUNT(*), COUNT(DISTINCT product_id)
    INTO anon_vote_count, anon_product_count
    FROM product_votes
    WHERE user_id IS NULL;

    -- Output results
    RAISE NOTICE 'Anonymous votes: %', COALESCE(anon_vote_count, 0);
    RAISE NOTICE 'Products with anonymous votes: %', COALESCE(anon_product_count, 0);
    
    RAISE NOTICE 'Section 11 complete.';
END $$;

-- 12. Performance metrics
DO $$
DECLARE
    r record;
BEGIN
    RAISE NOTICE E'\n=== [12/14] Performance Analysis ===';
    FOR r IN
        EXPLAIN ANALYZE
        SELECT p.*, pr.score,
               DENSE_RANK() OVER (ORDER BY pr.score DESC) as rank
        FROM products p
        JOIN product_rankings pr ON pr.id = p.id
        WHERE p.category = 'gaming-mice'
        ORDER BY rank ASC
    LOOP
        RAISE NOTICE '%', r;
    END LOOP;
    
    RAISE NOTICE 'Section 12 complete.';
END $$;

-- 13. Verify indexes
DO $$
DECLARE
    r record;
BEGIN
    RAISE NOTICE E'\n=== [13/14] Index Verification ===';
    FOR r IN
        SELECT 
            schemaname || '.' || tablename as "Table",
            indexname as "Index Name",
            regexp_replace(indexdef, 'CREATE (UNIQUE )?INDEX [^ ]+ ON ', '') as "Definition"
        FROM pg_indexes
        WHERE tablename IN ('product_votes', 'products', 'product_rankings')
        ORDER BY tablename, indexname
    LOOP
        RAISE NOTICE 'Table: %, Index: %, Definition: %',
            r."Table", r."Index Name", r."Definition";
    END LOOP;
    
    RAISE NOTICE 'Section 13 complete.';
END $$;

-- Results Summary
DO $$
DECLARE
    vote_count integer;
    product_count integer;
    voted_products integer;
    voting_users integer;
    recent_votes integer;
BEGIN
    RAISE NOTICE E'\n=== [14/14] System Status Summary ===';
    -- Get counts
    SELECT COUNT(*) INTO vote_count FROM product_votes;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(DISTINCT product_id) INTO voted_products FROM product_votes;
    SELECT COUNT(DISTINCT user_id) INTO voting_users FROM product_votes WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO recent_votes 
    FROM product_votes 
    WHERE created_at >= (now() - interval '24 hours');

    -- Output results
    RAISE NOTICE '------------------------';
    RAISE NOTICE 'Total Votes: %', vote_count;
    RAISE NOTICE 'Total Products: %', product_count;
    RAISE NOTICE 'Products with Votes: %', voted_products;
    RAISE NOTICE 'Unique Voters: %', voting_users;
    RAISE NOTICE 'Votes in Last 24h: %', recent_votes;
    RAISE NOTICE '------------------------';
    
    RAISE NOTICE E'\n==== VERIFICATION SCRIPT COMPLETE ====\n';
END $$; 
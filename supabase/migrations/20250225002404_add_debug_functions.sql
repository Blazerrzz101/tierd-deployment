-- Add debugging functions to help diagnose database issues

-- Function to get column information for a table
CREATE OR REPLACE FUNCTION public.debug_get_columns(table_name text)
RETURNS jsonb AS $$
DECLARE
    result jsonb;
BEGIN
    SELECT jsonb_agg(jsonb_build_object(
        'column_name', column_name,
        'data_type', data_type,
        'is_nullable', is_nullable,
        'column_default', column_default
    ))
    INTO result
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = debug_get_columns.table_name;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_get_columns(text) TO authenticated, anon;

-- Function to analyze vote data for a product
CREATE OR REPLACE FUNCTION public.debug_product_votes(p_product_id uuid)
RETURNS jsonb AS $$
DECLARE
    product_data jsonb;
    vote_data jsonb;
    vote_counts jsonb;
    result jsonb;
BEGIN
    -- Get product data
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'upvotes', upvotes,
        'downvotes', downvotes,
        'score', COALESCE(upvotes, 0) - COALESCE(downvotes, 0),
        'upvotes_type', pg_typeof(upvotes),
        'downvotes_type', pg_typeof(downvotes)
    )
    INTO product_data
    FROM products
    WHERE id = p_product_id;
    
    -- Get vote data
    SELECT jsonb_agg(jsonb_build_object(
        'id', id,
        'product_id', product_id,
        'user_id', user_id,
        'vote_type', vote_type,
        'vote_type_astext', vote_type::text,
        'vote_type_type', pg_typeof(vote_type),
        'metadata', metadata,
        'created_at', created_at,
        'updated_at', updated_at
    ))
    INTO vote_data
    FROM votes
    WHERE product_id = p_product_id;
    
    -- Count votes directly
    SELECT jsonb_build_object(
        'upvotes', COUNT(*) FILTER (WHERE vote_type = 1),
        'downvotes', COUNT(*) FILTER (WHERE vote_type = -1),
        'total', COUNT(*),
        'vote_types', jsonb_object_agg(COALESCE(vote_type::text, 'null'), COUNT(*))
    )
    INTO vote_counts
    FROM votes
    WHERE product_id = p_product_id
    GROUP BY product_id;
    
    -- Build result
    result := jsonb_build_object(
        'product', product_data,
        'votes', vote_data,
        'counts', vote_counts,
        'analysis', jsonb_build_object(
            'upvotes_match', (vote_counts->>'upvotes')::integer = (product_data->>'upvotes')::integer,
            'downvotes_match', (vote_counts->>'downvotes')::integer = (product_data->>'downvotes')::integer,
            'score_match', 
                ((vote_counts->>'upvotes')::integer - (vote_counts->>'downvotes')::integer) = 
                ((product_data->>'upvotes')::integer - (product_data->>'downvotes')::integer)
        )
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.debug_product_votes(uuid) TO authenticated, anon;

-- Function to fix vote counts for a product
CREATE OR REPLACE FUNCTION public.fix_product_vote_counts(p_product_id uuid)
RETURNS jsonb AS $$
DECLARE
    v_upvotes integer;
    v_downvotes integer;
    v_original_upvotes integer;
    v_original_downvotes integer;
    result jsonb;
BEGIN
    -- Get original values
    SELECT upvotes, downvotes INTO v_original_upvotes, v_original_downvotes
    FROM products
    WHERE id = p_product_id;
    
    -- Count votes directly
    SELECT 
        COUNT(*) FILTER (WHERE vote_type = 1), 
        COUNT(*) FILTER (WHERE vote_type = -1)
    INTO v_upvotes, v_downvotes
    FROM votes
    WHERE product_id = p_product_id;
    
    -- Ensure values are integers
    v_upvotes := COALESCE(v_upvotes, 0)::integer;
    v_downvotes := COALESCE(v_downvotes, 0)::integer;
    
    -- Update product
    UPDATE products
    SET 
        upvotes = v_upvotes,
        downvotes = v_downvotes,
        score = (v_upvotes - v_downvotes)::integer,
        updated_at = now()
    WHERE id = p_product_id;
    
    -- Return result
    result := jsonb_build_object(
        'product_id', p_product_id,
        'original', jsonb_build_object(
            'upvotes', v_original_upvotes,
            'downvotes', v_original_downvotes,
            'score', COALESCE(v_original_upvotes, 0) - COALESCE(v_original_downvotes, 0)
        ),
        'new', jsonb_build_object(
            'upvotes', v_upvotes,
            'downvotes', v_downvotes,
            'score', v_upvotes - v_downvotes
        ),
        'changes_made', (v_original_upvotes != v_upvotes OR v_original_downvotes != v_downvotes)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fix_product_vote_counts(uuid) TO authenticated, anon;

-- Function to fix all vote counts
CREATE OR REPLACE FUNCTION public.fix_all_product_vote_counts()
RETURNS jsonb AS $$
DECLARE
    product_id uuid;
    fix_count integer := 0;
    product_count integer := 0;
    failed_count integer := 0;
    result jsonb;
    single_result jsonb;
BEGIN
    -- Loop through all products
    FOR product_id IN SELECT id FROM products
    LOOP
        BEGIN
            product_count := product_count + 1;
            
            -- Fix vote counts for this product
            single_result := public.fix_product_vote_counts(product_id);
            
            -- Increment fix count if changes were made
            IF (single_result->>'changes_made')::boolean THEN
                fix_count := fix_count + 1;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            failed_count := failed_count + 1;
        END;
    END LOOP;
    
    -- Return result
    result := jsonb_build_object(
        'total_products', product_count,
        'products_fixed', fix_count,
        'failed_products', failed_count,
        'timestamp', now()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fix_all_product_vote_counts() TO authenticated, anon; 
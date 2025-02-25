-- Add function to fix vote counts for all products
CREATE OR REPLACE FUNCTION public.fix_all_product_vote_counts()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    product_record record;
    total_products integer := 0;
    fixed_products integer := 0;
    v_upvotes integer;
    v_downvotes integer;
    needs_fixing boolean;
    product_details jsonb[];
    result jsonb;
BEGIN
    -- Process each product
    FOR product_record IN 
        SELECT id, name, upvotes, downvotes, score
        FROM products
        ORDER BY id
        LIMIT 1000 -- Safety limit
    LOOP
        total_products := total_products + 1;
        
        -- Count actual votes
        SELECT 
            COALESCE(COUNT(*) FILTER (WHERE vote_type = 1), 0)::integer, 
            COALESCE(COUNT(*) FILTER (WHERE vote_type = -1), 0)::integer
        INTO v_upvotes, v_downvotes
        FROM votes
        WHERE product_id = product_record.id;
        
        -- Ensure values are integers
        v_upvotes := COALESCE(v_upvotes, 0)::integer;
        v_downvotes := COALESCE(v_downvotes, 0)::integer;
        
        -- Check if counts match
        needs_fixing := 
            (product_record.upvotes IS NULL OR product_record.upvotes != v_upvotes) OR
            (product_record.downvotes IS NULL OR product_record.downvotes != v_downvotes) OR
            (product_record.score IS NULL OR product_record.score != (v_upvotes - v_downvotes));
        
        -- Fix if needed
        IF needs_fixing THEN
            UPDATE products
            SET 
                upvotes = v_upvotes,
                downvotes = v_downvotes,
                score = (v_upvotes - v_downvotes)::integer,
                updated_at = now()
            WHERE id = product_record.id;
            
            fixed_products := fixed_products + 1;
            
            -- Store details for reporting
            product_details := product_details || jsonb_build_object(
                'id', product_record.id,
                'name', product_record.name,
                'before', jsonb_build_object(
                    'upvotes', product_record.upvotes,
                    'downvotes', product_record.downvotes,
                    'score', product_record.score
                ),
                'after', jsonb_build_object(
                    'upvotes', v_upvotes,
                    'downvotes', v_downvotes,
                    'score', (v_upvotes - v_downvotes)::integer
                )
            );
        END IF;
    END LOOP;
    
    -- Build the result object
    result := jsonb_build_object(
        'total_products', total_products,
        'fixed_products', fixed_products,
        'details', product_details
    );
    
    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'An error occurred: ' || SQLERRM,
            'total_products', total_products,
            'fixed_products', fixed_products
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.fix_all_product_vote_counts() TO authenticated; 
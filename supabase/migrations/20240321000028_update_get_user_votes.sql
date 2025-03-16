-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_user_votes(uuid[]);
DROP FUNCTION IF EXISTS public.get_user_votes(uuid[], text);

-- Create improved get_user_votes function
CREATE OR REPLACE FUNCTION public.get_user_votes(
    p_product_ids uuid[] DEFAULT NULL::uuid[],
    p_client_id text DEFAULT NULL::text
)
RETURNS TABLE (
    product_id uuid,
    vote_type integer,
    created_at timestamptz,
    product_name text,
    product_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.product_id,
        v.vote_type,
        v.created_at,
        p.name as product_name,
        p.category as product_category
    FROM votes v
    JOIN products p ON v.product_id = p.id
    WHERE (p_product_ids IS NULL OR v.product_id = ANY(p_product_ids))
    AND (
        (auth.uid() IS NOT NULL AND v.user_id = auth.uid())
        OR
        (auth.uid() IS NULL AND p_client_id IS NOT NULL AND v.metadata->>'client_id' = p_client_id)
    )
    ORDER BY v.created_at DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_votes(uuid[], text) TO authenticated, anon; 
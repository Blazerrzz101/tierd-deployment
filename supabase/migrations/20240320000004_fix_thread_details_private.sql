-- Drop existing function
DROP FUNCTION IF EXISTS get_thread_details(UUID);

-- Create function with is_private field
CREATE OR REPLACE FUNCTION get_thread_details(p_thread_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    upvotes INTEGER,
    downvotes INTEGER,
    mentioned_products UUID[],
    is_pinned BOOLEAN,
    is_locked BOOLEAN,
    is_private BOOLEAN,
    user_name TEXT,
    user_avatar TEXT,
    products JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the thread is accessible to the current user
    IF NOT EXISTS (
        SELECT 1 FROM threads t
        WHERE t.id = p_thread_id
        AND (
            -- Public thread with product association
            (NOT t.is_private AND EXISTS (
                SELECT 1 FROM thread_products tp 
                WHERE tp.thread_id = t.id
            ))
            OR 
            -- Private thread owned by the current user
            (t.is_private AND t.user_id = auth.uid())
        )
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        t.*,
        up.username::TEXT as user_name,
        up.avatar_url::TEXT as user_avatar,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'name', p.name,
                    'url_slug', p.url_slug,
                    'category', p.category
                )
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::jsonb
        ) as products
    FROM threads t
    LEFT JOIN user_profiles up ON t.user_id = up.id
    LEFT JOIN thread_products tp ON t.id = tp.thread_id
    LEFT JOIN products p ON tp.product_id = p.id
    WHERE t.id = p_thread_id
    GROUP BY t.id, up.username, up.avatar_url;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_thread_details(UUID) TO authenticated, anon; 
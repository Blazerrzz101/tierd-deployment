-- Fix get_thread_details function

-- Drop existing function
DROP FUNCTION IF EXISTS get_thread_details(UUID);

-- Create function with correct user profile fields
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
    user_name TEXT,
    user_avatar TEXT,
    products JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
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

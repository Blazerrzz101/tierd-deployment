-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.get_threads_with_products;

-- Create function to get threads with products
CREATE OR REPLACE FUNCTION public.get_threads_with_products(p_category text DEFAULT NULL)
RETURNS TABLE (
    id uuid,
    title text,
    content text,
    user_id uuid,
    created_at timestamptz,
    updated_at timestamptz,
    upvotes integer,
    downvotes integer,
    mentioned_products text[],
    is_pinned boolean,
    is_locked boolean,
    user_info jsonb,
    products jsonb[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH thread_products AS (
        SELECT 
            tp.thread_id,
            array_agg(
                jsonb_build_object(
                    'id', p.id,
                    'name', p.name,
                    'description', p.description,
                    'category', p.category,
                    'price', p.price,
                    'image_url', p.image_url,
                    'url_slug', p.url_slug,
                    'specifications', p.specifications
                )
            ) as product_array
        FROM public.thread_products tp
        JOIN public.products p ON p.id = tp.product_id
        WHERE 
            CASE 
                WHEN p_category IS NOT NULL THEN p.category = p_category
                ELSE TRUE
            END
        GROUP BY tp.thread_id
    )
    SELECT 
        t.id,
        t.title,
        t.content,
        t.user_id,
        t.created_at,
        t.updated_at,
        t.upvotes,
        t.downvotes,
        t.mentioned_products,
        t.is_pinned,
        t.is_locked,
        jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'avatar_url', u.avatar_url
        ) as user_info,
        COALESCE(tp.product_array, ARRAY[]::jsonb[]) as products
    FROM public.threads t
    LEFT JOIN public.users u ON u.id = t.user_id
    LEFT JOIN thread_products tp ON tp.thread_id = t.id
    WHERE 
        CASE 
            WHEN p_category IS NOT NULL THEN 
                EXISTS (
                    SELECT 1 
                    FROM public.thread_products tp2
                    JOIN public.products p2 ON p2.id = tp2.product_id
                    WHERE tp2.thread_id = t.id AND p2.category = p_category
                )
            ELSE TRUE
        END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_threads_with_products TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_threads_with_products TO anon;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_thread_products_category 
ON public.products(category) 
WHERE category IS NOT NULL;

-- Create index for thread sorting
CREATE INDEX IF NOT EXISTS idx_threads_pinned_created 
ON public.threads(is_pinned, created_at DESC);

COMMENT ON FUNCTION public.get_threads_with_products IS 
'Gets threads with their associated products and user information. Optionally filters by product category.'; 
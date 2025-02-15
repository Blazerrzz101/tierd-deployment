-- Drop existing function first
DROP FUNCTION IF EXISTS get_product_details(text);

-- Create function to get product details
CREATE OR REPLACE FUNCTION get_product_details(p_slug TEXT)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    url_slug VARCHAR(255),
    description TEXT,
    category product_category,
    price DECIMAL(10,2),
    image_url TEXT,
    specifications JSONB,
    votes INTEGER,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    related_products JSONB,
    upvotes BIGINT,
    downvotes BIGINT,
    score BIGINT,
    rating DECIMAL(3,2),
    review_count INTEGER,
    stock_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH product_info AS (
        SELECT 
            p.*,
            COALESCE(v.upvotes, 0) as upvotes,
            COALESCE(v.downvotes, 0) as downvotes,
            COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0) as score,
            COALESCE(r.avg_rating, 0) as rating,
            COALESCE(r.review_count, 0) as review_count,
            CASE
                WHEN p.specifications->>'stock_quantity' IS NULL OR (p.specifications->>'stock_quantity')::INTEGER > 10 THEN 'in_stock'
                WHEN (p.specifications->>'stock_quantity')::INTEGER > 0 THEN 'low_stock'
                ELSE 'out_of_stock'
            END as stock_status
        FROM products p
        LEFT JOIN (
            SELECT 
                product_id,
                COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
                COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
            FROM product_votes
            GROUP BY product_id
        ) v ON v.product_id = p.id
        LEFT JOIN (
            SELECT 
                product_id,
                AVG(rating)::DECIMAL(3,2) as avg_rating,
                COUNT(*) as review_count
            FROM product_reviews
            GROUP BY product_id
        ) r ON r.product_id = p.id
        WHERE p.url_slug = p_slug
    ),
    related AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'id', r.id,
                    'name', r.name,
                    'url_slug', r.url_slug,
                    'price', r.price,
                    'votes', r.votes,
                    'category', r.category::text
                )
            ) as related_products
        FROM product_info p
        JOIN products r ON r.category = p.category 
            AND r.id != p.id
        WHERE r.votes > 0
        GROUP BY p.id
    )
    SELECT 
        p.id,
        p.name,
        p.url_slug,
        p.description,
        p.category,
        p.price,
        p.image_url,
        p.specifications,
        p.votes,
        p.rank,
        p.created_at,
        p.updated_at,
        COALESCE(r.related_products, '[]'::jsonb),
        p.upvotes,
        p.downvotes,
        p.score,
        p.rating,
        p.review_count,
        p.stock_status
    FROM product_info p
    LEFT JOIN related r ON true;
END;
$$ LANGUAGE plpgsql; 
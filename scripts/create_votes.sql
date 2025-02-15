-- Create votes table and related functions

-- Drop existing objects if they exist
DROP TABLE IF EXISTS product_votes CASCADE;
DROP TYPE IF EXISTS vote_type CASCADE;

-- Create vote type enum
CREATE TYPE vote_type AS ENUM ('up', 'down');

-- Create votes table
CREATE TABLE product_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_product_votes_product ON product_votes(product_id);
CREATE INDEX IF NOT EXISTS idx_product_votes_user ON product_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_product_votes_type ON product_votes(vote_type);

-- Create function to cast vote
CREATE OR REPLACE FUNCTION vote_for_product(
    p_product_id UUID,
    p_user_id UUID,
    p_vote_type vote_type
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO product_votes (product_id, user_id, vote_type)
    VALUES (p_product_id, p_user_id, p_vote_type)
    ON CONFLICT (product_id, user_id)
    DO UPDATE SET 
        vote_type = p_vote_type,
        updated_at = CURRENT_TIMESTAMP;
        
    -- Update product votes count
    WITH vote_counts AS (
        SELECT 
            COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
            COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
        FROM product_votes
        WHERE product_id = p_product_id
    )
    UPDATE products
    SET votes = (SELECT (upvotes - downvotes) FROM vote_counts)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to remove vote
CREATE OR REPLACE FUNCTION remove_product_vote(
    p_product_id UUID,
    p_user_id UUID
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM product_votes
    WHERE product_id = p_product_id AND user_id = p_user_id;
    
    -- Update product votes count
    WITH vote_counts AS (
        SELECT 
            COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
            COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
        FROM product_votes
        WHERE product_id = p_product_id
    )
    UPDATE products
    SET votes = (SELECT (upvotes - downvotes) FROM vote_counts)
    WHERE id = p_product_id;
END;
$$ LANGUAGE plpgsql;

-- Create product details view
CREATE OR REPLACE VIEW product_details AS
SELECT 
    p.*,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0) as score
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
        COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
    FROM product_votes
    GROUP BY product_id
) v ON v.product_id = p.id;

-- Drop existing rankings function
DROP FUNCTION IF EXISTS get_product_rankings(product_category, integer, integer);

-- Create function to get product rankings
CREATE OR REPLACE FUNCTION get_product_rankings(
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    url_slug VARCHAR(255),
    description TEXT,
    category TEXT,
    price DECIMAL(10,2),
    image_url TEXT,
    specifications JSONB,
    votes INTEGER,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    upvotes BIGINT,
    downvotes BIGINT,
    score BIGINT,
    rating DECIMAL(3,2),
    review_count INTEGER,
    stock_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pd.*,
        ROW_NUMBER() OVER (
            PARTITION BY pd.category 
            ORDER BY pd.votes DESC, pd.created_at DESC
        )::INTEGER as rank,
        COALESCE(r.avg_rating, 0) as rating,
        COALESCE(r.review_count, 0) as review_count,
        CASE
            WHEN pd.specifications->>'stock_quantity' IS NULL OR (pd.specifications->>'stock_quantity')::INTEGER > 10 THEN 'in_stock'
            WHEN (pd.specifications->>'stock_quantity')::INTEGER > 0 THEN 'low_stock'
            ELSE 'out_of_stock'
        END as stock_status
    FROM product_details pd
    LEFT JOIN (
        SELECT 
            product_id,
            AVG(rating)::DECIMAL(3,2) as avg_rating,
            COUNT(*) as review_count
        FROM product_reviews
        GROUP BY product_id
    ) r ON r.product_id = pd.id
    WHERE 
        CASE 
            WHEN p_category IS NOT NULL THEN pd.category::TEXT = p_category
            ELSE TRUE
        END
    ORDER BY pd.votes DESC, pd.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql; 
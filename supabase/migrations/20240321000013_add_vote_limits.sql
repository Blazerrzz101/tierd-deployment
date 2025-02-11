-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Create a table to track anonymous votes by IP
CREATE TABLE IF NOT EXISTS anonymous_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ip_address TEXT NOT NULL,
    vote_count INTEGER DEFAULT 1,
    last_vote_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on ip_address for faster lookups
CREATE INDEX IF NOT EXISTS anonymous_votes_ip_address_idx ON anonymous_votes(ip_address);

-- Function to check and update anonymous vote limits
CREATE OR REPLACE FUNCTION check_anonymous_vote_limit(client_ip TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    vote_record RECORD;
    max_anonymous_votes CONSTANT INTEGER := 5;
BEGIN
    -- Get or create vote record for this IP
    SELECT * INTO vote_record
    FROM anonymous_votes
    WHERE ip_address = client_ip;
    
    IF NOT FOUND THEN
        -- First vote from this IP
        INSERT INTO anonymous_votes (ip_address)
        VALUES (client_ip);
        RETURN TRUE;
    END IF;
    
    IF vote_record.vote_count >= max_anonymous_votes THEN
        RETURN FALSE;
    END IF;
    
    -- Increment vote count
    UPDATE anonymous_votes
    SET vote_count = vote_count + 1,
        updated_at = NOW()
    WHERE ip_address = client_ip;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refresh product rankings
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS void AS $$
BEGIN
    -- Update vote counts for each product
    WITH vote_counts AS (
        SELECT 
            product_id,
            COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
            COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes
        FROM votes
        GROUP BY product_id
    )
    UPDATE products p
    SET 
        votes = COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0),
        rank = sub.rank
    FROM (
        SELECT 
            product_id,
            ROW_NUMBER() OVER (
                PARTITION BY products.category 
                ORDER BY (COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0)) DESC
            ) as rank
        FROM products
        LEFT JOIN vote_counts vc ON products.id = vc.product_id
    ) sub
    LEFT JOIN vote_counts vc ON p.id = vc.product_id
    WHERE p.id = sub.product_id;
END;
$$ LANGUAGE plpgsql; 
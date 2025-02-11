-- Create cache table for expensive queries
CREATE TABLE IF NOT EXISTS query_cache (
    cache_key TEXT PRIMARY KEY,
    cache_value JSONB,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to get or set cached value
CREATE OR REPLACE FUNCTION get_cached_value(
    p_cache_key TEXT,
    p_ttl_minutes INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
    v_cached_value JSONB;
BEGIN
    -- Try to get cached value
    SELECT cache_value INTO v_cached_value
    FROM query_cache
    WHERE cache_key = p_cache_key
    AND expires_at > NOW();

    -- Return cached value if found
    IF v_cached_value IS NOT NULL THEN
        RETURN v_cached_value;
    END IF;

    -- Clean up expired cache entries
    DELETE FROM query_cache
    WHERE expires_at <= NOW();

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set cached value
CREATE OR REPLACE FUNCTION set_cached_value(
    p_cache_key TEXT,
    p_cache_value JSONB,
    p_ttl_minutes INTEGER DEFAULT 5
)
RETURNS void AS $$
BEGIN
    INSERT INTO query_cache (cache_key, cache_value, expires_at)
    VALUES (
        p_cache_key,
        p_cache_value,
        NOW() + (p_ttl_minutes || ' minutes')::INTERVAL
    )
    ON CONFLICT (cache_key) DO UPDATE
    SET 
        cache_value = EXCLUDED.cache_value,
        expires_at = EXCLUDED.expires_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cache product rankings
CREATE OR REPLACE FUNCTION get_cached_rankings(
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_cache_minutes INTEGER DEFAULT 5
)
RETURNS JSONB AS $$
DECLARE
    v_cache_key TEXT;
    v_cached_data JSONB;
    v_fresh_data JSONB;
BEGIN
    -- Generate cache key
    v_cache_key := 'rankings:' || COALESCE(p_category, 'all') || ':' || p_limit;
    
    -- Try to get cached data
    v_cached_data := get_cached_value(v_cache_key, p_cache_minutes);
    
    IF v_cached_data IS NOT NULL THEN
        RETURN v_cached_data;
    END IF;
    
    -- Get fresh data
    SELECT jsonb_agg(row_to_json(p))
    INTO v_fresh_data
    FROM (
        SELECT *
        FROM products
        WHERE (p_category IS NULL OR category = p_category)
        ORDER BY votes DESC, created_at DESC
        LIMIT p_limit
    ) p;
    
    -- Cache the fresh data
    PERFORM set_cached_value(v_cache_key, v_fresh_data, p_cache_minutes);
    
    RETURN v_fresh_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cache product details
CREATE OR REPLACE FUNCTION get_cached_product_details(
    p_product_id UUID,
    p_cache_minutes INTEGER DEFAULT 15
)
RETURNS JSONB AS $$
DECLARE
    v_cache_key TEXT;
    v_cached_data JSONB;
    v_fresh_data JSONB;
BEGIN
    -- Generate cache key
    v_cache_key := 'product:' || p_product_id::TEXT;
    
    -- Try to get cached data
    v_cached_data := get_cached_value(v_cache_key, p_cache_minutes);
    
    IF v_cached_data IS NOT NULL THEN
        RETURN v_cached_data;
    END IF;
    
    -- Get fresh data
    SELECT row_to_json(p)::JSONB
    INTO v_fresh_data
    FROM (
        SELECT 
            p.*,
            COUNT(DISTINCT v.id) as vote_count,
            COUNT(DISTINCT r.id) as review_count
        FROM products p
        LEFT JOIN votes v ON p.id = v.product_id
        LEFT JOIN reviews r ON p.id = r.product_id
        WHERE p.id = p_product_id
        GROUP BY p.id
    ) p;
    
    -- Cache the fresh data
    PERFORM set_cached_value(v_cache_key, v_fresh_data, p_cache_minutes);
    
    RETURN v_fresh_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to invalidate cache for a product
CREATE OR REPLACE FUNCTION invalidate_product_cache(p_product_id UUID)
RETURNS void AS $$
BEGIN
    -- Delete product-specific cache
    DELETE FROM query_cache
    WHERE cache_key = 'product:' || p_product_id::TEXT;
    
    -- Delete rankings cache as they might include this product
    DELETE FROM query_cache
    WHERE cache_key LIKE 'rankings:%';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to invalidate cache when product is updated
CREATE OR REPLACE FUNCTION trigger_invalidate_product_cache()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM invalidate_product_cache(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_cache_invalidation
    AFTER UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION trigger_invalidate_product_cache();

-- Add RLS policies
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;

-- Allow public read access to cache
CREATE POLICY "Public read access to cache"
    ON query_cache FOR SELECT
    TO PUBLIC
    USING (true);

-- Only allow service role to modify cache
CREATE POLICY "Service role can modify cache"
    ON query_cache FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Create index for cache lookup
CREATE INDEX idx_query_cache_expires_at ON query_cache(expires_at);

-- Create maintenance function to clean expired cache
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM query_cache
    WHERE expires_at <= NOW();
END;
$$ LANGUAGE plpgsql; 
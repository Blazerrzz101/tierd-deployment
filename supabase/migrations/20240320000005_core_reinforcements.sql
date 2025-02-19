-- Add additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_url_slug ON products(url_slug);

-- Add constraints for data integrity
ALTER TABLE products
    ADD CONSTRAINT check_valid_url_slug 
    CHECK (url_slug ~ '^[a-z0-9-]+$'),
    ADD CONSTRAINT check_valid_name
    CHECK (length(name) BETWEEN 1 AND 255);

-- Create function to clean and validate URL slugs
CREATE OR REPLACE FUNCTION clean_url_slug(input_slug TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN lower(regexp_replace(input_slug, '[^a-zA-Z0-9-]', '', 'g'));
END;
$$;

-- Create function to handle product updates with validation
CREATE OR REPLACE FUNCTION handle_product_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean URL slug
    NEW.url_slug := clean_url_slug(NEW.url_slug);
    
    -- Ensure category is valid
    IF NEW.category NOT IN (
        'Gaming Mice', 'Gaming Keyboards', 'Gaming Headsets', 
        'Gaming Monitors', 'Gaming Chairs'
    ) THEN
        RAISE EXCEPTION 'Invalid category: %', NEW.category;
    END IF;
    
    -- Ensure price is valid
    IF NEW.price < 0 THEN
        RAISE EXCEPTION 'Price cannot be negative';
    END IF;
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$;

-- Create trigger for product updates
DROP TRIGGER IF EXISTS trigger_product_update ON products;
CREATE TRIGGER trigger_product_update
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_product_update();

-- Create materialized view for category statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS category_stats AS
SELECT 
    category,
    COUNT(*) as product_count,
    AVG(price) as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price,
    SUM(COALESCE(v.upvotes, 0)) as total_upvotes,
    SUM(COALESCE(v.downvotes, 0)) as total_downvotes
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        COUNT(*) FILTER (WHERE vote_type = 1) as upvotes,
        COUNT(*) FILTER (WHERE vote_type = -1) as downvotes
    FROM votes
    GROUP BY product_id
) v ON p.id = v.product_id
GROUP BY category;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_stats ON category_stats(category);

-- Create function to refresh category stats
CREATE OR REPLACE FUNCTION refresh_category_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY category_stats;
    RETURN NULL;
END;
$$;

-- Create trigger to refresh category stats
DROP TRIGGER IF EXISTS trigger_refresh_category_stats ON products;
CREATE TRIGGER trigger_refresh_category_stats
    AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_category_stats();

-- Grant permissions
GRANT EXECUTE ON FUNCTION clean_url_slug(TEXT) TO authenticated;
GRANT SELECT ON category_stats TO anon, authenticated; 
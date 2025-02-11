-- Create table for product mentions in threads
CREATE TABLE IF NOT EXISTS product_mentions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(thread_id, product_id)
);

-- Function to extract and process product mentions from thread content
CREATE OR REPLACE FUNCTION process_product_mentions()
RETURNS TRIGGER AS $$
DECLARE
    mention_pattern TEXT;
    product_slug TEXT;
    product_id UUID;
BEGIN
    -- Clear existing mentions for this thread
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM product_mentions WHERE thread_id = NEW.id;
    END IF;
    
    -- Look for mentions in the format @product-slug
    FOR mention_pattern IN 
        SELECT regexp_matches(NEW.content, '@([a-zA-Z0-9-]+)', 'g')
    LOOP
        product_slug := mention_pattern[1];
        
        -- Find the product by slug
        SELECT id INTO product_id
        FROM products
        WHERE url_slug = product_slug;
        
        -- If product exists, create mention
        IF product_id IS NOT NULL THEN
            INSERT INTO product_mentions (thread_id, product_id)
            VALUES (NEW.id, product_id)
            ON CONFLICT (thread_id, product_id) DO NOTHING;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to process mentions when thread is created or updated
CREATE TRIGGER process_thread_mentions
    AFTER INSERT OR UPDATE OF content ON threads
    FOR EACH ROW
    EXECUTE FUNCTION process_product_mentions();

-- Create index for faster lookups
CREATE INDEX idx_product_mentions_product_id ON product_mentions(product_id);
CREATE INDEX idx_product_mentions_thread_id ON product_mentions(thread_id);

-- Function to get threads mentioning a product
CREATE OR REPLACE FUNCTION get_product_threads(p_product_id UUID)
RETURNS TABLE (
    thread_id UUID,
    title TEXT,
    content TEXT,
    author_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id as thread_id,
        t.title,
        t.content,
        t.author_id,
        t.created_at
    FROM threads t
    JOIN product_mentions pm ON t.id = pm.thread_id
    WHERE pm.product_id = p_product_id
    ORDER BY t.created_at DESC;
END;
$$ LANGUAGE plpgsql; 
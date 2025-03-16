-- Add more constraints and validations
DO $$ 
BEGIN
    -- Add URL slug constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_valid_url_slug'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT check_valid_url_slug 
        CHECK (url_slug ~ '^[a-z0-9-]+$');
    END IF;

    -- Add name length constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_valid_name'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT check_valid_name
        CHECK (length(name) BETWEEN 1 AND 255);
    END IF;
END $$;

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

-- Grant permissions
GRANT EXECUTE ON FUNCTION clean_url_slug(TEXT) TO authenticated; 
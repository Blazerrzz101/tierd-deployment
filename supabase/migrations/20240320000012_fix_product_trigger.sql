-- Drop existing trigger
DROP TRIGGER IF EXISTS trigger_product_update ON products;
DROP FUNCTION IF EXISTS handle_product_update();

-- Create function to handle product updates with new category format
CREATE OR REPLACE FUNCTION handle_product_update()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Clean URL slug
    NEW.url_slug := clean_url_slug(NEW.url_slug);
    
    -- Ensure category is valid
    IF NEW.category NOT IN (
        'gaming-mice', 'gaming-keyboards', 'gaming-headsets', 
        'gaming-monitors', 'gaming-chairs'
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
CREATE TRIGGER trigger_product_update
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION handle_product_update(); 
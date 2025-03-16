-- Fix missing or invalid image URLs
UPDATE products
SET image_url = CASE
    WHEN category = 'gaming-mice' THEN 'https://gaming-gear.com/images/mice/default-mouse.webp'
    WHEN category = 'keyboards' THEN 'https://gaming-gear.com/images/keyboards/default-keyboard.webp'
    WHEN category = 'monitors' THEN 'https://gaming-gear.com/images/monitors/default-monitor.webp'
    WHEN category = 'headsets' THEN 'https://gaming-gear.com/images/headsets/default-headset.webp'
    ELSE image_url
END
WHERE image_url IS NULL OR image_url = '' OR image_url NOT LIKE 'http%';

-- Add a NOT NULL constraint to prevent future null values
ALTER TABLE products
ALTER COLUMN image_url SET NOT NULL;

-- Add a check constraint to ensure URLs start with http
ALTER TABLE products
ADD CONSTRAINT valid_image_url 
CHECK (image_url ~ '^https?://.*');

-- Create a trigger to set default image URL if none provided
CREATE OR REPLACE FUNCTION set_default_image_url()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.image_url IS NULL OR NEW.image_url = '' THEN
        NEW.image_url := CASE
            WHEN NEW.category = 'gaming-mice' THEN 'https://gaming-gear.com/images/mice/default-mouse.webp'
            WHEN NEW.category = 'keyboards' THEN 'https://gaming-gear.com/images/keyboards/default-keyboard.webp'
            WHEN NEW.category = 'monitors' THEN 'https://gaming-gear.com/images/monitors/default-monitor.webp'
            WHEN NEW.category = 'headsets' THEN 'https://gaming-gear.com/images/headsets/default-headset.webp'
            ELSE 'https://gaming-gear.com/images/default-product.webp'
        END;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_image_url
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_default_image_url(); 
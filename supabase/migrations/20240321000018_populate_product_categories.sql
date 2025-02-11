-- Add specs column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'specs'
    ) THEN
        ALTER TABLE products ADD COLUMN specs JSONB DEFAULT '{}'::JSONB;
    END IF;
END $$;

-- Add amazon_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'amazon_url'
    ) THEN
        ALTER TABLE products ADD COLUMN amazon_url TEXT;
    END IF;
END $$;

-- Add unique constraint to url_slug if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE table_name = 'products'
        AND constraint_name = 'products_url_slug_key'
    ) THEN
        ALTER TABLE products ADD CONSTRAINT products_url_slug_key UNIQUE (url_slug);
    END IF;
END $$;

-- Function to generate URL-safe slugs
CREATE OR REPLACE FUNCTION generate_slug(name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                name,
                '[^a-zA-Z0-9\s-]',
                ''
            ),
            '\s+',
            '-'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Template for product specs based on category
CREATE OR REPLACE FUNCTION get_default_specs(category TEXT)
RETURNS JSONB AS $$
BEGIN
    CASE category
        WHEN 'keyboards' THEN
            RETURN '{
                "switch_type": "Mechanical",
                "layout": "Full-size",
                "backlight": "RGB",
                "connection": "USB-C",
                "keycap_material": "PBT",
                "hot_swappable": false,
                "wireless": false,
                "battery_life": null
            }'::JSONB;
        WHEN 'headsets' THEN
            RETURN '{
                "driver_size": "50mm",
                "frequency_response": "20Hz-20kHz",
                "impedance": "32 Ohm",
                "microphone": true,
                "wireless": false,
                "battery_life": null,
                "surround_sound": true,
                "noise_cancelling": false
            }'::JSONB;
        WHEN 'monitors' THEN
            RETURN '{
                "resolution": "2560x1440",
                "refresh_rate": 144,
                "panel_type": "IPS",
                "response_time": "1ms",
                "hdr": false,
                "gsync": false,
                "freesync": true,
                "size": "27 inch"
            }'::JSONB;
        ELSE
            RETURN '{
                "dpi": "16000",
                "buttons": 6,
                "wireless": false,
                "battery_life": null,
                "weight": "90g",
                "rgb": true,
                "sensor": "Optical"
            }'::JSONB;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample products for each category
INSERT INTO products (
    name,
    description,
    category,
    price,
    specs,
    url_slug,
    image_url,
    amazon_url
) VALUES 
-- Keyboards
(
    'HyperX Alloy Elite RGB',
    'Premium mechanical gaming keyboard with Cherry MX switches and full RGB backlighting',
    'keyboards',
    169.99,
    get_default_specs('keyboards') || '{"switch_type": "Cherry MX Red", "wireless": false}'::JSONB,
    'hyperx-alloy-elite-rgb',
    'https://example.com/images/hyperx-alloy-elite.jpg',
    'https://amazon.com/hyperx-alloy-elite'
),
(
    'Ducky One 3 SF',
    'Compact 65% mechanical keyboard with hot-swappable switches and PBT keycaps',
    'keyboards',
    129.99,
    get_default_specs('keyboards') || '{"layout": "65%", "hot_swappable": true}'::JSONB,
    'ducky-one-3-sf',
    'https://example.com/images/ducky-one-3.jpg',
    'https://amazon.com/ducky-one-3'
),
-- Headsets
(
    'SteelSeries Arctis Pro',
    'High-fidelity gaming headset with premium audio drivers and ClearCast microphone',
    'headsets',
    199.99,
    get_default_specs('headsets') || '{"frequency_response": "10Hz-40kHz"}'::JSONB,
    'steelseries-arctis-pro',
    'https://example.com/images/arctis-pro.jpg',
    'https://amazon.com/arctis-pro'
),
(
    'HyperX Cloud Alpha',
    'Premium gaming headset with dual chamber drivers and signature comfort',
    'headsets',
    99.99,
    get_default_specs('headsets'),
    'hyperx-cloud-alpha',
    'https://example.com/images/cloud-alpha.jpg',
    'https://amazon.com/cloud-alpha'
),
-- Monitors
(
    'LG 27GL850-B',
    '27" QHD Nano IPS gaming monitor with 144Hz refresh rate and G-Sync compatibility',
    'monitors',
    449.99,
    get_default_specs('monitors') || '{"hdr": true, "gsync": true}'::JSONB,
    'lg-27gl850-b',
    'https://example.com/images/lg-27gl850.jpg',
    'https://amazon.com/lg-27gl850'
),
(
    'Samsung Odyssey G7',
    '32" WQHD curved gaming monitor with 240Hz refresh rate and QLED technology',
    'monitors',
    699.99,
    get_default_specs('monitors') || '{"refresh_rate": 240, "size": "32 inch"}'::JSONB,
    'samsung-odyssey-g7',
    'https://example.com/images/odyssey-g7.jpg',
    'https://amazon.com/odyssey-g7'
)
ON CONFLICT (url_slug) DO UPDATE
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    specs = EXCLUDED.specs,
    image_url = EXCLUDED.image_url,
    amazon_url = EXCLUDED.amazon_url,
    updated_at = NOW();

-- Create a trigger to automatically generate slugs
CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.url_slug IS NULL THEN
        NEW.url_slug := generate_slug(NEW.name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_product_slug
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION generate_product_slug(); 
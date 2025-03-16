-- Populate Products with Specifications

-- Drop existing objects if they exist
DROP TABLE IF EXISTS products CASCADE;
DROP TYPE IF EXISTS product_category CASCADE;

-- Create category enum type
CREATE TYPE product_category AS ENUM (
    'gaming-mice',
    'gaming-keyboards',
    'gaming-headsets',
    'gaming-monitors'
);

-- Create necessary tables
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    url_slug VARCHAR(255) UNIQUE,
    description TEXT,
    category product_category NOT NULL,
    price DECIMAL(10,2),
    image_url TEXT,
    specifications JSONB,
    votes INTEGER DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on url_slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_url_slug ON products(url_slug);

-- Create trigger to generate url_slug from name
CREATE OR REPLACE FUNCTION generate_url_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.url_slug IS NULL OR NEW.url_slug = '' THEN
        NEW.url_slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ensure_url_slug ON products;
CREATE TRIGGER ensure_url_slug
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION generate_url_slug();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert the gaming mice we can see (with exact details from the image)
INSERT INTO products (name, description, category, price, votes, specifications, url_slug)
VALUES 
    ('Logitech G502 X PLUS', 
     'LIGHTFORCE hybrid optical-mechanical switches and LIGHTSPEED wireless technology combine in our most advanced gaming mouse ever.',
     'gaming-mice',
     149.99,
     1500,
     jsonb_build_object(
         'sensor', 'HERO 25K',
         'dpi', '100-25,600',
         'buttons', '13 programmable',
         'weight', '89g',
         'battery', 'Up to 60 hours',
         'connection', 'LIGHTSPEED Wireless'
     ),
     'logitech-g502-x-plus'
    ),
    ('Razer Viper V2 Pro',
     'Ultra-lightweight wireless gaming mouse with next-gen optical switches and Focus Pro 30K optical sensor.',
     'gaming-mice',
     149.99,
     880,
     jsonb_build_object(
         'sensor', 'Focus Pro 30K',
         'dpi', '100-30,000',
         'buttons', '5 programmable',
         'weight', '58g',
         'battery', 'Up to 80 hours',
         'connection', 'HyperSpeed Wireless'
     ),
     'razer-viper-v2-pro'
    ),
    ('Glorious Model O',
     'Ultra-lightweight gaming mouse with honeycomb shell design.',
     'gaming-mice',
     79.99,
     650,
     jsonb_build_object(
         'sensor', 'BAMF',
         'dpi', '400-16,000',
         'buttons', '6',
         'weight', '67g',
         'connection', 'Wired',
         'rgb', true
     ),
     'glorious-model-o'
    ),
    ('Finalmouse Starlight-12',
     'Ultra-lightweight magnesium alloy wireless gaming mouse.',
     'gaming-mice',
     189.99,
     750,
     jsonb_build_object(
         'sensor', 'Custom',
         'dpi', '100-20,000',
         'buttons', '6',
         'weight', '42g',
         'battery', 'Up to 160 hours',
         'connection', 'Wireless'
     ),
     'finalmouse-starlight-12'
    ),
    ('ZOWIE EC2-C',
     'Professional gaming mouse designed for competitive FPS gaming.',
     'gaming-mice',
     69.99,
     580,
     jsonb_build_object(
         'sensor', '3360',
         'dpi', '400-3200',
         'buttons', '5',
         'weight', '73g',
         'connection', 'Wired'
     ),
     'zowie-ec2-c'
    )
ON CONFLICT (url_slug) DO UPDATE
SET 
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    votes = EXCLUDED.votes,
    specifications = EXCLUDED.specifications;

-- Create view for product details
CREATE OR REPLACE VIEW product_details AS
SELECT 
    p.*,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0) as score,
    MAX(pv.created_at) as last_vote_timestamp
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
        COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
    FROM product_votes
    GROUP BY product_id
) v ON v.product_id = p.id
LEFT JOIN product_votes pv ON pv.product_id = p.id
GROUP BY p.id, v.upvotes, v.downvotes;

-- Create index for user votes lookup
CREATE INDEX IF NOT EXISTS idx_product_votes_user ON product_votes(user_id, product_id);

-- Create function to get user's vote for a product
CREATE OR REPLACE FUNCTION get_user_vote(p_product_id UUID, p_user_id UUID)
RETURNS TABLE (
    vote_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pv.vote_type,
        pv.created_at
    FROM product_votes pv
    WHERE pv.product_id = p_product_id 
    AND pv.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to get product by slug
CREATE OR REPLACE FUNCTION get_product_by_slug(slug TEXT)
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
    upvotes BIGINT,
    downvotes BIGINT,
    score BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM product_details WHERE url_slug = slug;
END;
$$ LANGUAGE plpgsql;

-- Add more gaming keyboards
INSERT INTO products (name, description, category, price, votes, specifications, url_slug)
VALUES 
    ('Razer Huntsman V2',
     'Optical gaming keyboard with analog switches and premium features.',
     'gaming-keyboards',
     199.99,
     920,
     jsonb_build_object(
         'switches', 'Razer Analog Optical',
         'form_factor', 'Full-size',
         'backlight', 'Razer Chroma RGB',
         'wrist_rest', 'Detachable magnetic',
         'connection', 'USB-C',
         'features', jsonb_build_array(
             'N-key rollover',
             'Multimedia controls',
             'USB 3.0 passthrough',
             'Aluminum construction'
         )
     ),
     'razer-huntsman-v2'
    ),
    ('Logitech G Pro X',
     'Tournament-grade tenkeyless mechanical gaming keyboard.',
     'gaming-keyboards',
     149.99,
     850,
     jsonb_build_object(
         'switches', 'Hot-swappable GX',
         'form_factor', 'Tenkeyless',
         'backlight', 'RGB',
         'connection', 'Detachable USB-C',
         'features', jsonb_build_array(
             'Compact design',
             'Programmable macros',
             'Onboard memory'
         )
     ),
     'logitech-g-pro-x'
    );

-- Add gaming headsets
INSERT INTO products (name, description, category, price, votes, specifications, url_slug)
VALUES 
    ('HyperX Cloud Alpha',
     'Premium gaming headset with dual chamber drivers.',
     'gaming-headsets',
     99.99,
     1200,
     jsonb_build_object(
         'drivers', '50mm Dual Chamber',
         'frequency_response', '13Hz–27,000Hz',
         'connection', '3.5mm',
         'microphone', 'Detachable noise-cancelling',
         'features', jsonb_build_array(
             'Memory foam ear cushions',
             'Aluminum frame',
             'Braided cable',
             'Cross-platform compatibility'
         )
     ),
     'hyperx-cloud-alpha'
    ),
    ('SteelSeries Arctis Pro',
     'High-fidelity gaming headset with dedicated DAC.',
     'gaming-headsets',
     249.99,
     780,
     jsonb_build_object(
         'drivers', '40mm Neodymium',
         'frequency_response', '10Hz–40,000Hz',
         'connection', 'USB and Optical',
         'microphone', 'Retractable ClearCast',
         'features', jsonb_build_array(
             'Hi-Res Audio certified',
             'DTS Headphone:X v2.0',
             'OLED control system',
             'Dual-battery system'
         )
     ),
     'steelseries-arctis-pro'
    );

-- Add gaming monitors
INSERT INTO products (name, description, category, price, votes, specifications, url_slug)
VALUES 
    ('ASUS ROG Swift PG279QM',
     '27-inch 1440p gaming monitor with 240Hz refresh rate.',
     'gaming-monitors',
     849.99,
     650,
     jsonb_build_object(
         'panel', 'IPS',
         'resolution', '2560x1440',
         'refresh_rate', '240Hz',
         'response_time', '1ms GTG',
         'hdr', 'HDR400',
         'features', jsonb_build_array(
             'G-SYNC Ultimate',
             'ELMB-Sync',
             'DisplayHDR 400',
             'Factory calibrated'
         )
     ),
     'asus-rog-swift-pg279qm'
    ),
    ('LG 27GP950-B',
     '27-inch 4K gaming monitor with HDMI 2.1.',
     'gaming-monitors',
     899.99,
     580,
     jsonb_build_object(
         'panel', 'Nano IPS',
         'resolution', '3840x2160',
         'refresh_rate', '160Hz',
         'response_time', '1ms GTG',
         'hdr', 'HDR600',
         'features', jsonb_build_array(
             'HDMI 2.1',
             'G-SYNC Compatible',
             'FreeSync Premium Pro',
             'DisplayHDR 600'
         )
     ),
     'lg-27gp950-b'
    )
ON CONFLICT (url_slug) DO UPDATE
SET 
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    votes = EXCLUDED.votes,
    specifications = EXCLUDED.specifications;

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
    score BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH product AS (
        SELECT pd.* 
        FROM product_details pd 
        WHERE pd.url_slug = p_slug
    ),
    related AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'url_slug', p.url_slug,
                'price', p.price,
                'votes', p.votes,
                'category', p.category
            )
        ) as related_products
        FROM products p
        WHERE p.category = (SELECT category FROM product)
        AND p.url_slug != p_slug
        LIMIT 4
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
        p.score
    FROM product p
    LEFT JOIN related r ON true;
END;
$$ LANGUAGE plpgsql;

-- Create function to get product rankings
CREATE OR REPLACE FUNCTION get_product_rankings(p_category product_category = NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    url_slug VARCHAR(255),
    category product_category,
    price DECIMAL(10,2),
    votes INTEGER,
    rank INTEGER,
    specifications JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.url_slug,
        p.category,
        p.price,
        p.votes,
        ROW_NUMBER() OVER (
            PARTITION BY p.category 
            ORDER BY p.votes DESC
        )::INTEGER as rank,
        p.specifications
    FROM products p
    WHERE 
        CASE 
            WHEN p_category IS NULL THEN TRUE
            ELSE p.category = p_category
        END
    ORDER BY 
        CASE 
            WHEN p_category IS NULL THEN p.category
            ELSE NULL
        END,
        p.votes DESC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_votes ON products(votes DESC);
CREATE INDEX IF NOT EXISTS idx_products_ranking ON products(category, votes DESC);

-- Create trigger to maintain vote counts
CREATE OR REPLACE FUNCTION update_product_votes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products 
        SET votes = (
            SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - 
                   COUNT(*) FILTER (WHERE vote_type = 'down')
            FROM product_votes
            WHERE product_id = NEW.product_id
        )
        WHERE id = NEW.product_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products 
        SET votes = (
            SELECT COUNT(*) FILTER (WHERE vote_type = 'up') - 
                   COUNT(*) FILTER (WHERE vote_type = 'down')
            FROM product_votes
            WHERE product_id = OLD.product_id
        )
        WHERE id = OLD.product_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS maintain_product_votes ON product_votes;
CREATE TRIGGER maintain_product_votes
    AFTER INSERT OR DELETE ON product_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_product_votes();

-- Verify the setup
DO $$
DECLARE
    r RECORD;
    total_count INTEGER;
    mice_count INTEGER;
    keyboard_count INTEGER;
    headset_count INTEGER;
    monitor_count INTEGER;
BEGIN
    RAISE NOTICE 'Database setup complete. Verifying...';
    
    -- Check product count
    SELECT COUNT(*) INTO total_count FROM products;
    RAISE NOTICE 'Total products: %', total_count;
    
    -- Check products by category
    SELECT COUNT(*) INTO mice_count FROM products WHERE category = 'gaming-mice';
    SELECT COUNT(*) INTO keyboard_count FROM products WHERE category = 'gaming-keyboards';
    SELECT COUNT(*) INTO headset_count FROM products WHERE category = 'gaming-headsets';
    SELECT COUNT(*) INTO monitor_count FROM products WHERE category = 'gaming-monitors';
    
    RAISE NOTICE 'Products by category:';
    RAISE NOTICE 'Gaming Mice: %', mice_count;
    RAISE NOTICE 'Gaming Keyboards: %', keyboard_count;
    RAISE NOTICE 'Gaming Headsets: %', headset_count;
    RAISE NOTICE 'Gaming Monitors: %', monitor_count;
    
    -- Check vote counts for gaming mice
    RAISE NOTICE 'Vote counts for gaming mice:';
    FOR r IN 
        SELECT name, votes 
        FROM products 
        WHERE category = 'gaming-mice'
        ORDER BY votes DESC
    LOOP
        RAISE NOTICE '% - % votes', r.name, r.votes;
    END LOOP;

    -- Check for duplicate URL slugs
    RAISE NOTICE 'Checking for duplicate URL slugs...';
    FOR r IN 
        SELECT url_slug, COUNT(*) as count
        FROM products
        GROUP BY url_slug
        HAVING COUNT(*) > 1
    LOOP
        RAISE NOTICE 'Duplicate found: % appears % times', r.url_slug, r.count;
    END LOOP;

    -- Verify product_votes table exists
    IF NOT EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'product_votes'
    ) THEN
        CREATE TABLE product_votes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            product_id UUID REFERENCES products(id),
            user_id UUID NOT NULL,
            vote_type TEXT CHECK (vote_type IN ('up', 'down')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(product_id, user_id)
        );
        RAISE NOTICE 'Created product_votes table';
    END IF;

    RAISE NOTICE 'Added gaming keyboards, headsets, and monitors with detailed specifications';
    RAISE NOTICE 'Created helper functions for product details and rankings';
    RAISE NOTICE 'Created performance indexes';
    RAISE NOTICE 'Verification complete!';
END $$; 
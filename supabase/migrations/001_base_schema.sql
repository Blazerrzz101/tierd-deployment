-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For better text search

-- Create product categories enum
CREATE TYPE product_category AS ENUM (
    'Gaming Mice',
    'Gaming Keyboards',
    'Gaming Monitors',
    'Gaming Headsets',
    'Gaming Chairs'
);

-- Create products table with enhanced specifications
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description TEXT,
    pros TEXT[],
    cons TEXT[],
    image_url TEXT,
    additional_images TEXT[],
    price DECIMAL(10,2),
    msrp DECIMAL(10,2),
    category product_category,
    url_slug VARCHAR(255) UNIQUE,
    brand VARCHAR(255),
    model VARCHAR(255),
    release_date DATE,
    specifications JSONB DEFAULT '{}'::jsonb,
    technical_specs JSONB DEFAULT '{}'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,
    meta_data JSONB DEFAULT '{}'::jsonb,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_price_update TIMESTAMPTZ,
    CONSTRAINT valid_price CHECK (price > 0),
    CONSTRAINT valid_msrp CHECK (msrp > 0),
    CONSTRAINT price_less_than_msrp CHECK (price <= msrp)
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Create reviews table with enhanced features
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    title TEXT,
    content TEXT,
    pros TEXT[],
    cons TEXT[],
    verified_purchase BOOLEAN DEFAULT false,
    helpful_votes INTEGER DEFAULT 0,
    reported_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_url_slug ON products(url_slug);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_release_date ON products(release_date DESC);
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_votes_product_id ON votes(product_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_helpful_votes ON reviews(helpful_votes DESC);

-- Create function to update product updated_at
CREATE OR REPLACE FUNCTION update_product_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for product updates
CREATE TRIGGER update_product_timestamp
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_updated_at();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for public access to products
CREATE POLICY "Allow public read access to products"
    ON products FOR SELECT
    TO public
    USING (true);

-- Create policies for votes
CREATE POLICY "Allow authenticated users to create votes"
    ON votes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own votes"
    ON votes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own votes"
    ON votes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to read all votes"
    ON votes FOR SELECT
    TO public
    USING (true);

-- Create policies for reviews
CREATE POLICY "Allow authenticated users to create reviews"
    ON reviews FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own reviews"
    ON reviews FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own reviews"
    ON reviews FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to read all reviews"
    ON reviews FOR SELECT
    TO public
    USING (true);

-- Insert sample data with enhanced specifications
INSERT INTO products (
    name, 
    description, 
    short_description,
    pros,
    cons,
    category, 
    url_slug, 
    price, 
    msrp,
    brand,
    model,
    specifications,
    technical_specs,
    features
) VALUES (
    'Logitech G Pro X Superlight',
    'The Logitech G Pro X Superlight is the ultimate gaming mouse designed for esports professionals, featuring an ultra-lightweight design and HERO 25K sensor for unparalleled precision and performance.',
    'Ultra-lightweight professional gaming mouse with HERO 25K sensor',
    ARRAY[
        'Extremely lightweight at just 63g',
        'Exceptional battery life up to 70 hours',
        'HERO 25K sensor provides unmatched accuracy',
        'Clean, minimalist design',
        'Excellent wireless performance'
    ],
    ARRAY[
        'Premium price point',
        'No RGB lighting',
        'Limited button customization',
        'Right-handed only design'
    ],
    'Gaming Mice',
    'logitech-g-pro-x-superlight',
    149.99,
    159.99,
    'Logitech',
    'G Pro X Superlight',
    '{
        "sensor": "HERO 25K",
        "dpi": 25600,
        "weight": "63g",
        "battery_life": "70 hours",
        "connection": "Wireless",
        "rgb": false
    }'::jsonb,
    '{
        "sensor_resolution": "100-25600 DPI",
        "max_acceleration": "40G",
        "max_speed": "400 IPS",
        "wireless_technology": "Lightspeed",
        "battery_type": "Rechargeable Li-Po",
        "battery_capacity": "450mAh",
        "polling_rate": "1000Hz",
        "button_durability": "20 million clicks",
        "feet_type": "Virgin grade PTFE"
    }'::jsonb,
    '{
        "zero_additive_smoothing": true,
        "zero_filter": true,
        "programmable_buttons": 5,
        "onboard_memory_profiles": 1,
        "powerplay_compatible": true,
        "adjustable_lod": true
    }'::jsonb
); 
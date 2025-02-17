-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create product categories enum
CREATE TYPE product_category AS ENUM (
    'Gaming Mice',
    'Gaming Keyboards',
    'Gaming Monitors',
    'Gaming Headsets',
    'Gaming Chairs'
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    price DECIMAL(10,2),
    category product_category,
    url_slug VARCHAR(255) UNIQUE,
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_url_slug ON products(url_slug);
CREATE INDEX IF NOT EXISTS idx_votes_product_id ON votes(product_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

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

-- Insert sample data
INSERT INTO products (name, description, category, url_slug, price, specifications) VALUES
(
    'Logitech G Pro X Superlight',
    'Ultra-lightweight gaming mouse designed for esports professionals',
    'Gaming Mice',
    'logitech-g-pro-x-superlight',
    149.99,
    '{
        "sensor": "HERO 25K",
        "dpi": 25600,
        "weight": "63g",
        "battery_life": "70 hours",
        "connection": "Wireless",
        "rgb": false
    }'
),
(
    'Razer Huntsman V2',
    'Optical gaming keyboard with advanced features',
    'Gaming Keyboards',
    'razer-huntsman-v2',
    199.99,
    '{
        "switches": "Razer Optical",
        "form_factor": "Full size",
        "backlight": "RGB",
        "wrist_rest": true,
        "connection": "Wired",
        "anti_ghosting": true
    }'
)
ON CONFLICT (url_slug) DO NOTHING; 
-- Reset the schema
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create the users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    is_online BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    preferred_accessories JSONB DEFAULT '[]'::jsonb,
    activity_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create the products table with proper url_slug column
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    url_slug TEXT NOT NULL UNIQUE,  -- Make sure url_slug is NOT NULL and UNIQUE
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create the product_votes table first
CREATE TABLE product_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(product_id, user_id)
);

-- Insert some sample products
INSERT INTO products (name, description, category, price, url_slug, image_url) VALUES
('Logitech G Pro X Superlight', 'Ultra-lightweight gaming mouse', 'Gaming Mice', 149.99, 'logitech-g-pro-x-superlight', 'https://example.com/gpro.jpg'),
('Razer Viper V2 Pro', 'High-performance wireless gaming mouse', 'Gaming Mice', 149.99, 'razer-viper-v2-pro', 'https://example.com/viper.jpg'),
('Pulsar X2', 'Lightweight symmetrical gaming mouse', 'Gaming Mice', 94.99, 'pulsar-x2', 'https://example.com/x2.jpg');

-- Insert some sample votes
INSERT INTO product_votes (product_id, user_id, vote_type)
SELECT 
    p.id,
    gen_random_uuid(),
    CASE WHEN random() > 0.3 THEN 'up' ELSE 'down' END
FROM products p
CROSS JOIN generate_series(1, 10);

-- Now create the materialized view after data exists
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_counts AS (
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.price,
        p.image_url,
        p.url_slug,
        COALESCE(COUNT(CASE WHEN pv.vote_type = 'up' THEN 1 END), 0) as upvotes,
        COALESCE(COUNT(CASE WHEN pv.vote_type = 'down' THEN 1 END), 0) as downvotes,
        COALESCE(COUNT(CASE WHEN pv.vote_type = 'neutral' THEN 1 END), 0) as neutral_votes
    FROM products p
    LEFT JOIN product_votes pv ON p.id = pv.product_id
    GROUP BY p.id, p.name, p.description, p.category, p.price, p.image_url, p.url_slug
)
SELECT 
    id,
    name,
    description,
    category,
    price,
    image_url,
    url_slug,
    upvotes,
    downvotes,
    neutral_votes,
    RANK() OVER (ORDER BY (upvotes - downvotes) DESC) as rank
FROM vote_counts;

-- Create indexes after view creation
CREATE UNIQUE INDEX ON product_rankings (id);
CREATE INDEX ON product_rankings (category);
CREATE INDEX ON product_rankings (url_slug);

-- Set up RLS policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to products"
    ON products FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public read access to product_votes"
    ON product_votes FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to vote"
    ON product_votes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Allow users to change their own votes"
    ON product_votes FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE ON product_votes TO authenticated;

-- Create the reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    helpful_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Grant permissions
GRANT INSERT, UPDATE ON reviews TO authenticated; 
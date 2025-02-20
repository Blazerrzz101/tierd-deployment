-- First drop all dependent objects
DROP MATERIALIZED VIEW IF EXISTS product_rankings CASCADE;
DROP VIEW IF EXISTS product_votes CASCADE;

-- Fix the votes table
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;
ALTER TABLE votes ALTER COLUMN vote_type TYPE text;
ALTER TABLE votes ADD CONSTRAINT votes_vote_type_check CHECK (vote_type IN ('up', 'down'));

-- Fix the products table
ALTER TABLE products ALTER COLUMN category TYPE text;
ALTER TABLE products ALTER COLUMN url_slug TYPE text;
ALTER TABLE products ALTER COLUMN specifications TYPE jsonb USING COALESCE(specifications::jsonb, '{}'::jsonb);

-- Add is_active column to products table if it doesn't exist
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE products ADD COLUMN is_active boolean DEFAULT true;
  END IF;
END $$;

-- Recreate the materialized view with integer vote_type handling
CREATE MATERIALIZED VIEW product_rankings AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    LOWER(REPLACE(p.category, ' ', '-')) as category_slug,
    p.price,
    p.image_url,
    p.url_slug,
    p.specifications,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(v.total_votes, 0) as total_votes,
    COALESCE(r.rating, 0) as rating,
    COALESCE(r.review_count, 0) as review_count,
    COALESCE(v.score, 0) as score,
    ROW_NUMBER() OVER (
        PARTITION BY LOWER(REPLACE(p.category, ' ', '-'))
        ORDER BY COALESCE(v.score, 0) DESC, 
                 COALESCE(v.total_votes, 0) DESC, 
                 p.name
    ) as rank
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        COUNT(CASE WHEN vote_type::integer = 1 THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type::integer = -1 THEN 1 END) as downvotes,
        COUNT(*) as total_votes,
        SUM(vote_type::integer) as score
    FROM votes
    GROUP BY product_id
) v ON p.id = v.product_id
LEFT JOIN (
    SELECT 
        product_id,
        AVG(rating) as rating,
        COUNT(*) as review_count
    FROM reviews
    GROUP BY product_id
) r ON p.id = r.product_id
WHERE p.is_active = true;

-- Create indexes for better performance
CREATE UNIQUE INDEX product_rankings_id_idx ON product_rankings (id);
CREATE INDEX product_rankings_category_slug_rank_idx ON product_rankings (category_slug, rank);
CREATE INDEX product_rankings_url_slug_idx ON product_rankings (url_slug);

-- Set ownership and permissions
ALTER MATERIALIZED VIEW product_rankings OWNER TO postgres;
GRANT SELECT ON product_rankings TO anon;
GRANT SELECT ON product_rankings TO authenticated;
GRANT SELECT ON product_rankings TO service_role;

-- Add constraint to votes table
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;
ALTER TABLE votes ADD CONSTRAINT votes_vote_type_check CHECK (vote_type::integer IN (1, -1));

-- Insert sample data for each category
INSERT INTO products (name, description, category, price, image_url, url_slug, specifications, is_active) VALUES
-- Gaming Mice
('Logitech G Pro X Superlight', 'Ultra-lightweight gaming mouse', 'Gaming Mice', 149.99, 'https://example.com/gpro.jpg', 'logitech-g-pro-x-superlight', '{"dpi": "25600", "weight": "63g", "connection": "wireless"}', true),
('Razer DeathAdder V3 Pro', 'Ergonomic gaming mouse', 'Gaming Mice', 159.99, 'https://example.com/da.jpg', 'razer-deathadder-v3-pro', '{"dpi": "30000", "weight": "64g", "connection": "wireless"}', true),
('Zowie EC2-C', 'Professional gaming mouse', 'Gaming Mice', 69.99, 'https://example.com/ec2.jpg', 'zowie-ec2-c', '{"dpi": "3200", "weight": "73g", "connection": "wired"}', true),

-- Gaming Keyboards
('Wooting 60 HE', 'Analog optical keyboard', 'Gaming Keyboards', 199.99, 'https://example.com/wooting.jpg', 'wooting-60-he', '{"switches": "Lekker", "size": "60%", "features": "analog"}', true),
('Keychron Q1', 'Custom mechanical keyboard', 'Gaming Keyboards', 179.99, 'https://example.com/q1.jpg', 'keychron-q1', '{"switches": "Gateron", "size": "75%", "features": "hot-swap"}', true),
('Ducky One 3', 'Premium gaming keyboard', 'Gaming Keyboards', 129.99, 'https://example.com/ducky.jpg', 'ducky-one-3', '{"switches": "Cherry MX", "size": "TKL", "features": "RGB"}', true),

-- Gaming Headsets
('Sennheiser HD 560S', 'Audiophile gaming headset', 'Gaming Headsets', 199.99, 'https://example.com/hd560s.jpg', 'sennheiser-hd-560s', '{"driver": "38mm", "impedance": "120ohm", "type": "open-back"}', true),
('HyperX Cloud Alpha', 'Premium gaming headset', 'Gaming Headsets', 99.99, 'https://example.com/alpha.jpg', 'hyperx-cloud-alpha', '{"driver": "50mm", "connection": "wired", "features": "detachable-mic"}', true),
('Beyerdynamic DT 900 Pro X', 'Studio gaming headset', 'Gaming Headsets', 299.99, 'https://example.com/dt900.jpg', 'beyerdynamic-dt-900-pro-x', '{"driver": "45mm", "impedance": "48ohm", "type": "open-back"}', true),

-- Gaming Monitors
('LG 27GP950-B', '4K 144Hz gaming monitor', 'Gaming Monitors', 799.99, 'https://example.com/lg.jpg', 'lg-27gp950-b', '{"resolution": "4K", "refresh": "144Hz", "panel": "Nano IPS"}', true),
('Samsung Odyssey G7', 'Curved gaming monitor', 'Gaming Monitors', 699.99, 'https://example.com/g7.jpg', 'samsung-odyssey-g7', '{"resolution": "1440p", "refresh": "240Hz", "panel": "VA"}', true),
('ASUS ROG Swift PG279QM', 'Esports gaming monitor', 'Gaming Monitors', 849.99, 'https://example.com/pg279qm.jpg', 'asus-rog-swift-pg279qm', '{"resolution": "1440p", "refresh": "240Hz", "panel": "IPS"}', true)
ON CONFLICT (id) DO NOTHING;

-- Refresh the view with the new permissions
REFRESH MATERIALIZED VIEW product_rankings; 
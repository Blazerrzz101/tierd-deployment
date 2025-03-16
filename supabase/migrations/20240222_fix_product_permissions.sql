-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
TO public
USING (true);

-- Create policies for votes
CREATE POLICY "Allow public read access to votes"
ON votes FOR SELECT
TO public
USING (true);

-- Create policies for reviews
CREATE POLICY "Allow public read access to reviews"
ON reviews FOR SELECT
TO public
USING (true);

-- Grant necessary permissions to anon and authenticated roles
GRANT SELECT ON products TO anon, authenticated;
GRANT SELECT ON reviews TO anon, authenticated;
GRANT SELECT ON votes TO anon, authenticated;

-- Grant access to product_rankings view
GRANT SELECT ON product_rankings TO authenticated, anon; 
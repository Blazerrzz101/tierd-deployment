-- Grant permissions to public role
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant access to products table
GRANT SELECT ON products TO anon;
GRANT SELECT ON products TO authenticated;

-- Grant access to votes table
GRANT SELECT ON votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON votes TO authenticated;

-- Grant access to reviews table
GRANT SELECT ON reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON reviews TO authenticated;

-- Grant access to product_rankings view
GRANT SELECT ON product_rankings TO anon;
GRANT SELECT ON product_rankings TO authenticated;

-- Grant execute permission on refresh function
GRANT EXECUTE ON FUNCTION refresh_product_rankings TO authenticated;

-- Ensure RLS is enabled
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read access to products" ON products;
DROP POLICY IF EXISTS "Allow authenticated users to create votes" ON votes;
DROP POLICY IF EXISTS "Allow users to update their own votes" ON votes;
DROP POLICY IF EXISTS "Allow users to delete their own votes" ON votes;
DROP POLICY IF EXISTS "Allow users to read all votes" ON votes;
DROP POLICY IF EXISTS "Allow authenticated users to create reviews" ON reviews;
DROP POLICY IF EXISTS "Allow users to update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Allow users to delete their own reviews" ON reviews;
DROP POLICY IF EXISTS "Allow users to read all reviews" ON reviews;

-- Create policies for public access to products
CREATE POLICY "Allow public read access to products"
    ON products FOR SELECT
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
    USING (true); 
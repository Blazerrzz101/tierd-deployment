-- Enable RLS on the products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to products
CREATE POLICY "Allow public read access to products"
ON products FOR SELECT
TO public
USING (true);

-- Grant necessary permissions to public roles
GRANT SELECT ON products TO anon;
GRANT SELECT ON product_rankings TO anon;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW product_rankings; 
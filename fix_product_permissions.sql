-- Enable RLS on the products table if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE tablename = 'products' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable read access for all users" ON products;

-- Create a policy that allows anyone to read products
CREATE POLICY "Enable read access for all users" ON products
    FOR SELECT
    USING (true);

-- Grant usage on the schema to authenticated and anonymous users
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant SELECT permissions on products table to anonymous users
GRANT SELECT ON products TO anon;

-- Verify the policy exists and show current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'products'; 
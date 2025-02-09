-- Grant access to anonymous users
GRANT SELECT ON public.product_rankings TO anon;

-- Update the policy to allow both authenticated and anonymous users
DROP POLICY IF EXISTS "Allow authenticated users to read rankings" ON public.product_rankings;

CREATE POLICY "Allow public read access to rankings"
ON public.product_rankings
FOR SELECT
TO public
USING (true);

-- Also ensure products table has proper permissions
GRANT SELECT ON public.products TO anon;

-- Enable RLS on products if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Add public read policy for products
CREATE POLICY "Allow public read access to products"
ON public.products
FOR SELECT
TO public
USING (true); 
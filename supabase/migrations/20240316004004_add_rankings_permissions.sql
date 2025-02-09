-- Grant access to the product_rankings table
GRANT SELECT ON public.product_rankings TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all authenticated users to read rankings
CREATE POLICY "Allow authenticated users to read rankings"
ON public.product_rankings
FOR SELECT
TO authenticated
USING (true); 
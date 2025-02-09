-- Drop existing product_rankings table
DROP TABLE IF EXISTS public.product_rankings;

-- Recreate product_rankings table with proper foreign key relationship
CREATE TABLE public.product_rankings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    net_score INT DEFAULT 0,
    rank INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on product_id for better join performance
CREATE INDEX idx_product_rankings_product_id ON public.product_rankings(product_id);

-- Grant necessary permissions
GRANT SELECT ON public.product_rankings TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;

-- Enable RLS
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to rankings"
ON public.product_rankings FOR SELECT
TO public
USING (true);

CREATE POLICY "Allow public read access to products"
ON public.products FOR SELECT
TO public
USING (true);

-- Insert initial rankings for all products
INSERT INTO public.product_rankings (product_id, upvotes, downvotes, net_score, rank)
SELECT 
    id as product_id,
    FLOOR(RANDOM() * 100)::int as upvotes,
    FLOOR(RANDOM() * 20)::int as downvotes,
    0 as net_score,
    ROW_NUMBER() OVER (PARTITION BY category ORDER BY RANDOM()) as rank
FROM public.products
ON CONFLICT (product_id) DO UPDATE
SET 
    upvotes = EXCLUDED.upvotes,
    downvotes = EXCLUDED.downvotes,
    net_score = EXCLUDED.net_score,
    rank = EXCLUDED.rank; 
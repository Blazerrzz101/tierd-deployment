-- First, clean up existing objects
DROP TABLE IF EXISTS public.product_rankings CASCADE;
DROP POLICY IF EXISTS "Allow public read access to rankings" ON public.product_rankings;
DROP POLICY IF EXISTS "Allow public read access to products" ON public.products;

-- Create the product_rankings table
CREATE TABLE public.product_rankings (
    product_id UUID PRIMARY KEY,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    net_score INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    CONSTRAINT fk_product
        FOREIGN KEY (product_id)
        REFERENCES public.products(id)
        ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_product_rankings_rank ON public.product_rankings(rank);

-- Grant basic read access
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Enable read access for all users" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.product_rankings
    FOR SELECT USING (true);

-- Insert sample rankings
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
    net_score = EXCLUDED.upvotes - EXCLUDED.downvotes,
    rank = EXCLUDED.rank; 
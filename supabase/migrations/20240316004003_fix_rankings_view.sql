-- Drop the existing materialized view
DROP MATERIALIZED VIEW IF EXISTS public.product_rankings;

-- Create a table instead of a materialized view for product rankings
CREATE TABLE IF NOT EXISTS public.product_rankings (
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    net_score INT DEFAULT 0,
    rank INT DEFAULT 0,
    PRIMARY KEY (product_id)
);

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
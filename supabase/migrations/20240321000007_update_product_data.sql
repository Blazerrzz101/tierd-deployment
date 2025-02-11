-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_rankings;

-- Create the policy
CREATE POLICY "Enable read access for all users" ON public.product_rankings
    FOR SELECT
    USING (true);

-- Initialize product rankings
INSERT INTO public.product_rankings (product_id, upvotes, downvotes, net_score, rank)
SELECT 
    id,
    FLOOR(RANDOM() * 100)::int as upvotes,
    FLOOR(RANDOM() * 20)::int as downvotes,
    0 as net_score,
    0 as rank
FROM public.products
ON CONFLICT (product_id) DO UPDATE
SET 
    upvotes = EXCLUDED.upvotes,
    downvotes = EXCLUDED.downvotes;

-- Fix URL slug for Logitech G Pro X Superlight
UPDATE public.products
SET url_slug = 'logitech-g-pro-x-superlight'
WHERE url_slug = 'logitech-gpro-x-superlight';

-- Verify the changes
SELECT p.name, p.url_slug, pr.upvotes, pr.downvotes
FROM public.products p
LEFT JOIN public.product_rankings pr ON p.id = pr.product_id
WHERE p.name ILIKE '%logitech%'; 
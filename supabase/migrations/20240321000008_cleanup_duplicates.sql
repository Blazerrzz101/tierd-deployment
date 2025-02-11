-- Find and remove duplicate products while keeping the one with the earliest ID
WITH duplicate_products AS (
    SELECT id,
           name,
           url_slug,
           ROW_NUMBER() OVER (PARTITION BY name, url_slug ORDER BY id) as rn
    FROM public.products
)
-- First, remove rankings for products that will be deleted
DELETE FROM public.product_rankings
WHERE product_id IN (
    SELECT id 
    FROM duplicate_products 
    WHERE rn > 1
);

-- Then remove the duplicate products
DELETE FROM public.products
WHERE id IN (
    SELECT id 
    FROM duplicate_products 
    WHERE rn > 1
);

-- Update the URL slug for the Logitech mouse
UPDATE public.products
SET url_slug = 'logitech-g-pro-x-superlight'
WHERE url_slug = 'logitech-gpro-x-superlight';

-- Verify the cleanup
SELECT p.id, p.name, p.url_slug, pr.upvotes, pr.downvotes
FROM public.products p
LEFT JOIN public.product_rankings pr ON p.id = pr.product_id
WHERE p.name ILIKE '%logitech%'
ORDER BY p.name; 
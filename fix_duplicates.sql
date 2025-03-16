BEGIN;

-- First, identify the product we want to keep
WITH product_to_keep AS (
    SELECT id
    FROM public.products
    WHERE name = 'Logitech G Pro X Superlight'
    ORDER BY id
    LIMIT 1
)
-- Delete rankings for products we don't want to keep
DELETE FROM public.product_rankings
WHERE product_id IN (
    SELECT p.id 
    FROM public.products p
    WHERE p.name = 'Logitech G Pro X Superlight'
    AND p.id NOT IN (SELECT id FROM product_to_keep)
);

-- Then delete the duplicate products
WITH product_to_keep AS (
    SELECT id
    FROM public.products
    WHERE name = 'Logitech G Pro X Superlight'
    ORDER BY id
    LIMIT 1
)
DELETE FROM public.products
WHERE name = 'Logitech G Pro X Superlight'
AND id NOT IN (SELECT id FROM product_to_keep);

-- Update the URL slug for the remaining product
UPDATE public.products
SET url_slug = 'logitech-g-pro-x-superlight'
WHERE name = 'Logitech G Pro X Superlight';

-- Update or insert the ranking for the remaining product
WITH product_to_update AS (
    SELECT id
    FROM public.products
    WHERE name = 'Logitech G Pro X Superlight'
    LIMIT 1
)
INSERT INTO public.product_rankings (product_id, upvotes, downvotes, net_score, rank)
SELECT 
    id,
    54,
    12,
    42,
    1
FROM product_to_update
ON CONFLICT (product_id) DO UPDATE
SET 
    upvotes = EXCLUDED.upvotes,
    downvotes = EXCLUDED.downvotes,
    net_score = EXCLUDED.net_score,
    rank = EXCLUDED.rank;

COMMIT;

-- Verify the cleanup
SELECT p.id, p.name, p.url_slug, pr.upvotes, pr.downvotes
FROM public.products p
LEFT JOIN public.product_rankings pr ON p.id = pr.product_id
WHERE p.name ILIKE '%logitech%'
ORDER BY p.id; 
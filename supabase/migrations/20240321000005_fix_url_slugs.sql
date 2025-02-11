-- Fix URL slug for Logitech G Pro X Superlight
UPDATE public.products
SET url_slug = 'logitech-g-pro-x-superlight'
WHERE url_slug = 'logitech-gpro-x-superlight';

-- Verify the change
SELECT id, name, url_slug
FROM public.products
WHERE name ILIKE '%logitech%'; 
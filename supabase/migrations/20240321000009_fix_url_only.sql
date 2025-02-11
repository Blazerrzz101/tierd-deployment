-- Update the URL slug for the Logitech mouse
UPDATE public.products
SET url_slug = 'logitech-g-pro-x-superlight'
WHERE url_slug = 'logitech-gpro-x-superlight';

-- Verify the change
SELECT id, name, url_slug
FROM public.products
WHERE name ILIKE '%logitech%'; 
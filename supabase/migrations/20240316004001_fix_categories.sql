-- Update category names to match frontend expectations
UPDATE public.products 
SET category = 'gaming-mice'
WHERE category = 'mice';

UPDATE public.products
SET category = 'gaming-keyboards'
WHERE category = 'keyboards';

UPDATE public.products
SET category = 'gaming-headsets'
WHERE category = 'headsets';

UPDATE public.products
SET category = 'gaming-monitors'
WHERE category = 'monitors';

UPDATE public.products
SET category = 'gaming-mousepads'
WHERE category = 'mousepads'; 
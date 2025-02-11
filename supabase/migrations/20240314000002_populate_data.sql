-- Migration: Populate Initial Data
-- Description: Populates the database with initial product data and categories
-- Author: James Montgomery
-- Date: 2024-03-14

-- Start transaction for atomic operations
BEGIN;

-- Create test users and store their IDs
CREATE TABLE IF NOT EXISTS test_users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE
);

WITH inserted_users AS (
    INSERT INTO auth.users (
        id, instance_id, aud, role, email,
        encrypted_password, email_confirmed_at,
        created_at, updated_at,
        confirmation_token, recovery_token, email_change_token_new,
        raw_app_meta_data, raw_user_meta_data,
        is_super_admin
    )
    SELECT
        gen_random_uuid(),
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'testuser' || seq || '@test.com',
        crypt('testpassword', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        NULL,
        NULL,
        NULL,
        jsonb_build_object(
            'provider', 'email',
            'providers', ARRAY['email']
        ),
        jsonb_build_object(
            'username', 'testuser' || seq
        ),
        FALSE
    FROM generate_series(1,10) seq
    RETURNING id, email
)
INSERT INTO test_users (id, email)
SELECT id, email FROM inserted_users;

-- Create initial product categories
INSERT INTO public.product_categories (name, description, slug)
VALUES
    ('Keyboards', 'Mechanical and membrane keyboards for all typing needs', 'keyboards'),
    ('Mice', 'Gaming and productivity mice with various sensor types', 'mice'),
    ('Monitors', 'High refresh rate and professional displays', 'monitors'),
    ('Audio', 'Headphones, speakers, and audio interfaces', 'audio'),
    ('Storage', 'SSDs, HDDs, and external storage solutions', 'storage'),
    ('Networking', 'Routers, switches, and networking equipment', 'networking'),
    ('Accessories', 'Various computer and desk accessories', 'accessories')
ON CONFLICT (slug) DO UPDATE
SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- Insert sample products
INSERT INTO public.products (
    name,
    description,
    category,
    price,
    image_url,
    url_slug
)
VALUES
    (
        'Logitech G Pro X Superlight',
        'Ultra-lightweight wireless gaming mouse with HERO 25K sensor',
        'Mice',
        149.99,
        'https://source.unsplash.com/random/800x600/?mouse',
        'logitech-g-pro-x-superlight'
    ),
    (
        'Keychron Q1',
        'Customizable mechanical keyboard with QMK/VIA support',
        'Keyboards',
        169.99,
        'https://source.unsplash.com/random/800x600/?keyboard',
        'keychron-q1'
    ),
    (
        'LG 27GP950-B',
        '27" 4K UHD Nano IPS Gaming Monitor with 144Hz refresh rate',
        'Monitors',
        799.99,
        'https://source.unsplash.com/random/800x600/?monitor',
        'lg-27gp950-b'
    ),
    (
        'Samsung 970 EVO Plus',
        '1TB NVMe M.2 SSD with up to 3,500 MB/s read speeds',
        'Storage',
        109.99,
        'https://source.unsplash.com/random/800x600/?ssd',
        'samsung-970-evo-plus'
    ),
    (
        'Audio-Technica ATH-M50x',
        'Professional studio monitor headphones',
        'Audio',
        149.99,
        'https://source.unsplash.com/random/800x600/?headphones',
        'audio-technica-ath-m50x'
    ),
    (
        'ASUS RT-AX86U',
        'Wi-Fi 6 gaming router with 2.5G port',
        'Networking',
        249.99,
        'https://source.unsplash.com/random/800x600/?router',
        'asus-rt-ax86u'
    ),
    (
        'Glorious Model O',
        'Ultra-lightweight gaming mouse with honeycomb design',
        'Mice',
        59.99,
        'https://source.unsplash.com/random/800x600/?gaming_mouse',
        'glorious-model-o'
    ),
    (
        'Ducky One 2 Mini',
        '60% mechanical keyboard with Cherry MX switches',
        'Keyboards',
        99.99,
        'https://source.unsplash.com/random/800x600/?mechanical_keyboard',
        'ducky-one-2-mini'
    )
ON CONFLICT (url_slug) DO UPDATE
SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    category = EXCLUDED.category,
    price = EXCLUDED.price,
    image_url = EXCLUDED.image_url;

-- Generate reviews and votes
DO $$
DECLARE
    product_record RECORD;
    user_record RECORD;
    vote_types TEXT[] := ARRAY['up', 'down'];
    review_texts TEXT[] := ARRAY[
        'After extensive testing in competitive matches, this product has exceeded my expectations. The response time and precision are outstanding.',
        'The build quality and performance are exceptional. Every detail has been carefully considered, from the ergonomics to the software integration.',
        'A perfect balance of features and performance. The customization options are extensive, and the quality is top-notch.'
    ];
BEGIN
    -- Generate reviews and votes for each product
    FOR product_record IN SELECT * FROM products LOOP
        -- Generate reviews
        FOR user_record IN SELECT * FROM test_users ORDER BY random() LIMIT floor(random() * 5 + 2)::int LOOP
            INSERT INTO reviews (
                id, product_id, user_id, rating, title, content, created_at
            ) VALUES (
                gen_random_uuid(),
                product_record.id,
                user_record.id,
                floor(random() * 3 + 3)::int,  -- Ratings between 3 and 5
                'Review for ' || product_record.name,
                review_texts[floor(random() * array_length(review_texts, 1) + 1)::int],
                NOW() - (random() * interval '30 days')
            );
        END LOOP;

        -- Generate votes
        FOR user_record IN SELECT * FROM test_users ORDER BY random() LIMIT floor(random() * 8 + 2)::int LOOP
            INSERT INTO product_votes (
                id, product_id, user_id, vote_type, created_at
            ) VALUES (
                gen_random_uuid(),
                product_record.id,
                user_record.id,
                vote_types[floor(random() * array_length(vote_types, 1) + 1)::int],
                NOW() - (random() * interval '30 days')
            );
        END LOOP;
    END LOOP;
END $$;

-- Create initial product rankings
REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_rankings;

-- Create function to periodically update rankings
CREATE OR REPLACE FUNCTION public.update_rankings_hourly()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh rankings
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_rankings;
END;
$$;

-- Set up scheduled task to update rankings
SELECT cron.schedule(
    'update-rankings',
    '0 * * * *', -- Every hour
    'SELECT public.update_rankings_hourly()'
);

COMMIT; 
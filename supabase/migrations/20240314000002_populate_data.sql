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

-- Insert sample products
INSERT INTO products (
    name, brand, category, price, rating, details, image_url, description, url_slug,
    upvotes, downvotes, neutral_votes, score, controversy_score
) VALUES
    (
        'Logitech G Pro X Superlight',
        'Logitech',
        'Gaming Mice',
        149.99,
        4.8,
        '{"weight": "63g", "sensor": "HERO 25K", "connection": "Wireless"}',
        'https://example.com/gpro.jpg',
        'Ultra-lightweight professional gaming mouse',
        'logitech-g-pro-x-superlight',
        100,
        10,
        5,
        90.0,
        0.91
    ),
    (
        'Razer Viper V2 Pro',
        'Razer',
        'Gaming Mice',
        149.99,
        4.7,
        '{"weight": "58g", "sensor": "Focus Pro 30K", "connection": "Wireless"}',
        'https://example.com/viper.jpg',
        'High-performance wireless gaming mouse',
        'razer-viper-v2-pro',
        90,
        15,
        8,
        75.0,
        0.86
    ),
    (
        'Pulsar X2',
        'Pulsar',
        'Gaming Mice',
        94.99,
        4.6,
        '{"weight": "52g", "sensor": "PAW3395", "connection": "Wireless"}',
        'https://example.com/x2.jpg',
        'Lightweight symmetrical gaming mouse',
        'pulsar-x2',
        80,
        20,
        10,
        60.0,
        0.80
    );

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

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW product_rankings;

COMMIT; 
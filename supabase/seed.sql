-- This seed file runs automatically when the database is initialized

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure proper schema setup
CREATE SCHEMA IF NOT EXISTS public;

-- Grant proper permissions to public schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Grant basic read access to anon and authenticated roles
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;

-- Create or replace function to automatically set updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure tables exist with proper structure
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    url_slug TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_url_slug UNIQUE (url_slug)
);

CREATE TABLE IF NOT EXISTS public.product_rankings (
    product_id UUID PRIMARY KEY REFERENCES public.products(id) ON DELETE CASCADE,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    net_score INTEGER DEFAULT 0,
    rank INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_product_rankings_rank ON public.product_rankings(rank);

-- Set up automatic updated_at for both tables
DROP TRIGGER IF EXISTS set_updated_at ON public.products;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.product_rankings;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.product_rankings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_rankings ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.products;
CREATE POLICY "Enable read access for all users" ON public.products
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON public.product_rankings;
CREATE POLICY "Enable read access for all users" ON public.product_rankings
    FOR SELECT USING (true);

-- Create test users
INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin
)
VALUES 
(
    'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test1@example.com',
    crypt('testpassword', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NULL,
    NULL,
    NULL,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    '{"name": "Test User 1"}'::jsonb,
    FALSE
),
(
    'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test2@example.com',
    crypt('testpassword', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    NULL,
    NULL,
    NULL,
    jsonb_build_object('provider', 'email', 'providers', ARRAY['email']),
    '{"name": "Test User 2"}'::jsonb,
    FALSE
);

-- Create test products
INSERT INTO products (id, name, category, price, image_url, description, url_slug)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Test Product 1', 'gaming-mice', 99.99, 
   'https://example.com/img1.jpg', 'A great test product', 'test-product-1'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Test Product 2', 'gaming-keyboards', 149.99,
   'https://example.com/img2.jpg', 'Another amazing product', 'test-product-2'),
  
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Test Product 3', 'gaming-headsets', 199.99,
   'https://example.com/img3.jpg', 'The best product ever', 'test-product-3');

-- Add some product votes
INSERT INTO product_votes (product_id, user_id, vote_type)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c', 'up'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7', 'up'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7', 'up');

-- Insert sample products
INSERT INTO products (name, description, category, price, votes, specifications, url_slug, image_url)
VALUES 
    ('Logitech G502 X PLUS', 
     'LIGHTFORCE hybrid optical-mechanical switches and LIGHTSPEED wireless technology combine in our most advanced gaming mouse ever.',
     'gaming-mice',
     149.99,
     1500,
     jsonb_build_object(
         'sensor', 'HERO 25K',
         'dpi', '100-25,600',
         'buttons', '13 programmable',
         'weight', '89g',
         'battery', 'Up to 60 hours',
         'connection', 'LIGHTSPEED Wireless'
     ),
     'logitech-g502-x-plus',
     '/images/products/logitech-g502-x-plus.png'
    ),
    ('Razer Viper V2 Pro',
     'Ultra-lightweight wireless gaming mouse with next-gen optical switches and Focus Pro 30K optical sensor.',
     'gaming-mice',
     149.99,
     880,
     jsonb_build_object(
         'sensor', 'Focus Pro 30K',
         'dpi', '100-30,000',
         'buttons', '5 programmable',
         'weight', '58g',
         'battery', 'Up to 80 hours',
         'connection', 'HyperSpeed Wireless'
     ),
     'razer-viper-v2-pro',
     '/images/products/razer-viper-v2-pro.png'
    ),
    ('Glorious Model O',
     'Ultra-lightweight gaming mouse with honeycomb shell design.',
     'gaming-mice',
     79.99,
     650,
     jsonb_build_object(
         'sensor', 'BAMF',
         'dpi', '400-16,000',
         'buttons', '6',
         'weight', '67g',
         'connection', 'Wired',
         'rgb', true
     ),
     'glorious-model-o',
     '/images/products/glorious-model-o.png'
    ),
    ('Razer Huntsman V2',
     'Optical gaming keyboard with analog switches and premium features.',
     'gaming-keyboards',
     199.99,
     920,
     jsonb_build_object(
         'switches', 'Razer Analog Optical',
         'form_factor', 'Full-size',
         'backlight', 'Razer Chroma RGB',
         'wrist_rest', 'Detachable magnetic',
         'connection', 'USB-C',
         'features', jsonb_build_array(
             'N-key rollover',
             'Multimedia controls',
             'USB 3.0 passthrough',
             'Aluminum construction'
         )
     ),
     'razer-huntsman-v2',
     '/images/products/razer-huntsman-v2.png'
    ),
    ('HyperX Cloud Alpha',
     'Premium gaming headset with dual chamber drivers.',
     'gaming-headsets',
     99.99,
     1200,
     jsonb_build_object(
         'drivers', '50mm Dual Chamber',
         'frequency_response', '13Hz–27,000Hz',
         'connection', '3.5mm',
         'microphone', 'Detachable noise-cancelling',
         'features', jsonb_build_array(
             'Memory foam ear cushions',
             'Aluminum frame',
             'Braided cable',
             'Cross-platform compatibility'
         )
     ),
     'hyperx-cloud-alpha',
     '/images/products/hyperx-cloud-alpha.png'
    ),
    ('ASUS ROG Swift PG279QM',
     '27-inch 1440p gaming monitor with 240Hz refresh rate.',
     'gaming-monitors',
     849.99,
     650,
     jsonb_build_object(
         'panel', 'IPS',
         'resolution', '2560x1440',
         'refresh_rate', '240Hz',
         'response_time', '1ms GTG',
         'hdr', 'HDR400',
         'features', jsonb_build_array(
             'G-SYNC Ultimate',
             'ELMB-Sync',
             'DisplayHDR 400',
             'Factory calibrated'
         )
     ),
     'asus-rog-swift-pg279qm',
     '/images/products/asus-rog-swift-pg279qm.png'
    ),
    ('Samsung Odyssey G7',
     '32-inch curved gaming monitor with QLED technology.',
     'gaming-monitors',
     799.99,
     720,
     jsonb_build_object(
         'panel', 'VA QLED',
         'resolution', '2560x1440',
         'refresh_rate', '240Hz',
         'response_time', '1ms GTG',
         'hdr', 'HDR600',
         'curvature', '1000R',
         'features', jsonb_build_array(
             'G-SYNC Compatible',
             'FreeSync Premium Pro',
             'DisplayHDR 600',
             'Infinity Core Lighting'
         )
     ),
     'samsung-odyssey-g7',
     '/images/products/samsung-odyssey-g7.png'
    ),
    ('LG 27GN950-B',
     '27-inch 4K Nano IPS gaming monitor.',
     'gaming-monitors',
     899.99,
     580,
     jsonb_build_object(
         'panel', 'Nano IPS',
         'resolution', '3840x2160',
         'refresh_rate', '144Hz',
         'response_time', '1ms GTG',
         'hdr', 'HDR600',
         'features', jsonb_build_array(
             'G-SYNC Compatible',
             'FreeSync Premium Pro',
             'DisplayHDR 600',
             'Sphere Lighting 2.0'
         )
     ),
     'lg-27gn950-b',
     '/images/products/lg-27gn950-b.png'
    ),
    ('Logitech G Pro X Keyboard',
     'Tournament-grade tenkeyless mechanical gaming keyboard.',
     'gaming-keyboards',
     199.99,
     850,
     jsonb_build_object(
         'switches', 'GX Hot-swappable',
         'form_factor', 'Tenkeyless',
         'backlight', 'RGB per key',
         'connection', 'Detachable USB-C',
         'features', jsonb_build_array(
             'Programmable macros',
             'Onboard memory',
             'Aircraft-grade aluminum'
         )
     ),
     'logitech-g-pro-x-keyboard',
     '/images/products/logitech-g-pro-x-keyboard.png'
    ),
    ('SteelSeries Arctis Nova Pro',
     'High-end wireless gaming headset with active noise cancellation.',
     'gaming-headsets',
     349.99,
     920,
     jsonb_build_object(
         'drivers', 'Custom 40mm',
         'frequency_response', '10-40,000Hz',
         'connection', 'Wireless 2.4GHz/Bluetooth',
         'battery', 'Dual-battery system',
         'features', jsonb_build_array(
             'Active Noise Cancellation',
             'Hi-Res Audio certified',
             'Multi-system compatibility',
             'Hot-swappable batteries'
         )
     ),
     'steelseries-arctis-nova-pro',
     '/images/products/steelseries-arctis-nova-pro.png'
    ); 
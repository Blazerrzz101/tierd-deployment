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
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Test Product 1', 'Electronics', 99.99, 
   'https://example.com/img1.jpg', 'A great test product', 'test-product-1'),
  
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Test Product 2', 'Electronics', 149.99,
   'https://example.com/img2.jpg', 'Another amazing product', 'test-product-2'),
  
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Test Product 3', 'Electronics', 199.99,
   'https://example.com/img3.jpg', 'The best product ever', 'test-product-3');

-- Add some product votes
INSERT INTO product_votes (product_id, user_id, vote_type)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c', 'up'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c', 'down'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7', 'up'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7', 'up');

-- Add some reviews
INSERT INTO reviews (product_id, user_id, rating, title, content)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c', 5, 'Amazing Product!', 'Great product, exceeded my expectations!'),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7', 4, 'Pretty Good', 'Good value for money, would recommend.'),
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c', 5, 'Best Purchase Ever!', 'This is the best product I have ever bought!');

-- Add some test threads
INSERT INTO threads (id, title, content, user_id, created_at, upvotes, downvotes, mentioned_products)
VALUES 
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Best Gaming Mouse 2024?', 
   'Looking for recommendations on the best gaming mouse for FPS games. Currently considering the Pulsar X2 and Logitech G Pro X Superlight. Any thoughts?',
   'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c', NOW(), 5, 1,
   ARRAY['a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11']),
   
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'Mechanical Keyboard Showdown', 
   'Just got my hands on both the Keychron Q1 and GMMK Pro. Here are my initial impressions and comparison...',
   'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7', NOW(), 8, 2,
   ARRAY['b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12']);

-- Add thread comments
INSERT INTO thread_comments (thread_id, user_id, content)
VALUES 
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7',
   'I have been using the Pulsar X2 for a few months now. The weight and shape are perfect for FPS games.'),
   
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c',
   'Thanks for the feedback! How is the build quality?'),
   
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c',
   'Great comparison! Which one has better stabilizers out of the box?');

-- Add thread product mentions
INSERT INTO thread_products (thread_id, product_id)
VALUES 
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'),
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12');

-- Add thread votes
INSERT INTO thread_votes (thread_id, user_id, vote_type)
VALUES 
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'd0d8c19c-3b3e-4f5a-9b1a-e3cce01a9c5c', 'up'),
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7', 'up'),
  ('f1eebc99-9c0b-4ef8-bb6d-6bb9bd380a15', 'e1e9c2ad-4c4f-4f6b-0c2b-f4ddf1b0d6d7', 'up'); 
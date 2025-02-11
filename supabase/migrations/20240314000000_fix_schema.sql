-- Migration: Initial Schema Setup
-- Description: Sets up the initial database schema with core tables and functions
-- Author: James Montgomery
-- Date: 2024-03-14

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- For UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- For text search functionality
CREATE EXTENSION IF NOT EXISTS "pgjwt";          -- For JWT handling
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- For cryptographic functions

-- Set up search configuration
ALTER DATABASE postgres SET search_path TO public;

-- Create custom types
DO $$ BEGIN
    -- Enum for vote types (up/down)
    CREATE TYPE vote_type AS ENUM ('up', 'down');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create base tables
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text UNIQUE NOT NULL,
    username text UNIQUE NOT NULL,
    avatar_url text,
    is_online boolean DEFAULT false,
    is_public boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    last_seen timestamptz DEFAULT now(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
    CONSTRAINT email_valid CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Products table for storing product information
CREATE TABLE IF NOT EXISTS public.products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    category text NOT NULL,
    price numeric(10,2) NOT NULL,
    image_url text,
    url_slug text UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT name_not_empty CHECK (char_length(name) > 0),
    CONSTRAINT price_positive CHECK (price >= 0),
    CONSTRAINT category_not_empty CHECK (char_length(category) > 0)
);

-- Votes table for tracking user votes on products
CREATE TABLE IF NOT EXISTS public.votes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, product_id)
);

-- Product rankings materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS public.product_rankings AS
WITH vote_counts AS (
    SELECT 
        product_id,
        COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes
    FROM public.votes
    GROUP BY product_id
)
SELECT 
    p.id,
    p.name,
    p.category,
    p.price,
    p.image_url,
    p.url_slug,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0) as score,
    p.created_at
FROM public.products p
LEFT JOIN vote_counts v ON p.id = v.product_id
ORDER BY score DESC, p.created_at DESC;

-- Create index for faster ranking lookups
CREATE UNIQUE INDEX IF NOT EXISTS product_rankings_id_idx ON public.product_rankings (id);

-- Function to refresh product rankings
CREATE OR REPLACE FUNCTION public.refresh_product_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_rankings;
END;
$$;

-- Set up Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view public profiles"
    ON public.users FOR SELECT
    USING (is_public = true OR auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Product policies
CREATE POLICY "Anyone can view products"
    ON public.products FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Authenticated users can create products"
    ON public.products FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Product owners can update their products"
    ON public.products FOR UPDATE
    USING (auth.uid() IN (
        SELECT user_id
        FROM public.products_users
        WHERE product_id = id
    ));

-- Vote policies
CREATE POLICY "Anyone can view votes"
    ON public.votes FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Authenticated users can vote"
    ON public.votes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify their own votes"
    ON public.votes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
    ON public.votes FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to handle vote updates
CREATE OR REPLACE FUNCTION public.handle_vote_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Refresh rankings when votes change
    PERFORM public.refresh_product_rankings();
    RETURN NEW;
END;
$$;

-- Create trigger for vote changes
CREATE TRIGGER on_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON public.votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.handle_vote_change();

-- Drop existing objects in correct dependency order
DO $$ 
BEGIN
    -- Drop materialized view if it exists
    DROP MATERIALIZED VIEW IF EXISTS product_rankings;
    
    -- Drop triggers if they exist and their tables exist
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_votes') THEN
        DROP TRIGGER IF EXISTS refresh_rankings_on_vote ON product_votes;
        DROP TRIGGER IF EXISTS update_vote_counts_trigger ON product_votes;
        DROP TRIGGER IF EXISTS refresh_rankings_on_review ON product_votes;
    END IF;
    
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reviews') THEN
        DROP TRIGGER IF EXISTS refresh_rankings_on_review ON reviews;
    END IF;
    
    -- Drop functions if they exist
    DROP FUNCTION IF EXISTS refresh_rankings() CASCADE;
    DROP FUNCTION IF EXISTS update_vote_counts() CASCADE;
    DROP FUNCTION IF EXISTS calculate_wilson_score() CASCADE;
    DROP FUNCTION IF EXISTS calculate_time_decay() CASCADE;
    
    -- Drop tables if they exist
    DROP TABLE IF EXISTS rate_limits CASCADE;
    DROP TABLE IF EXISTS product_votes CASCADE;
    DROP TABLE IF EXISTS reviews CASCADE;
    DROP TABLE IF EXISTS products CASCADE;
END $$;

-- Create the products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url_slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    rating NUMERIC(3,1) DEFAULT 0.0,
    details JSONB NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    description TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    neutral_votes INTEGER DEFAULT 0,
    score NUMERIC(10,2) DEFAULT 0,
    controversy_score NUMERIC(5,4) DEFAULT 0,
    last_vote_timestamp TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    source_url TEXT,
    CONSTRAINT valid_url_slug CHECK (url_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

-- Create the product_votes table
CREATE TABLE product_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down', 'neutral')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- Create the reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- Create rate limiting table
CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    attempt_timestamp TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT valid_action_type CHECK (action_type IN ('review', 'vote', 'product_review'))
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view products"
    ON products FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Authenticated users can vote"
    ON product_votes FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view votes"
    ON product_votes FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Authenticated users can review"
    ON reviews FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view reviews"
    ON reviews FOR SELECT
    TO PUBLIC
    USING (true);

CREATE POLICY "Rate limits are user specific"
    ON rate_limits FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create scoring functions
CREATE OR REPLACE FUNCTION calculate_wilson_score(up INTEGER, down INTEGER)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    n INTEGER;
    p DOUBLE PRECISION;
    z DOUBLE PRECISION := 1.96;
    left_side DOUBLE PRECISION;
    right_side DOUBLE PRECISION;
    under DOUBLE PRECISION;
BEGIN
    n := up + down;
    IF n = 0 THEN RETURN 0; END IF;
    
    p := up::DOUBLE PRECISION / n;
    left_side := p + (z * z / (2 * n));
    right_side := z * sqrt((p * (1 - p) + z * z / (4 * n)) / n);
    under := 1 + (z * z / n);
    
    RETURN ((left_side - right_side) / under);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION calculate_time_decay(vote_time TIMESTAMP WITH TIME ZONE)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    hours_since_vote DOUBLE PRECISION;
BEGIN
    IF vote_time IS NULL THEN RETURN 0; END IF;
    hours_since_vote := EXTRACT(EPOCH FROM (NOW() - vote_time)) / 3600;
    RETURN 1.0 / (1.0 + ln(1.0 + hours_since_vote));
END;
$$ LANGUAGE plpgsql STABLE;

-- Create functions for vote handling
CREATE OR REPLACE FUNCTION update_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE products
        SET 
            upvotes = upvotes + CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE 0 END,
            downvotes = downvotes + CASE WHEN NEW.vote_type = 'down' THEN 1 ELSE 0 END,
            neutral_votes = neutral_votes + CASE WHEN NEW.vote_type = 'neutral' THEN 1 ELSE 0 END,
            last_vote_timestamp = now()
        WHERE id = NEW.product_id;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE products
        SET 
            upvotes = upvotes + CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE 0 END - CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE 0 END,
            downvotes = downvotes + CASE WHEN NEW.vote_type = 'down' THEN 1 ELSE 0 END - CASE WHEN OLD.vote_type = 'down' THEN 1 ELSE 0 END,
            neutral_votes = neutral_votes + CASE WHEN NEW.vote_type = 'neutral' THEN 1 ELSE 0 END - CASE WHEN OLD.vote_type = 'neutral' THEN 1 ELSE 0 END,
            last_vote_timestamp = now()
        WHERE id = NEW.product_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE products
        SET 
            upvotes = upvotes - CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE 0 END,
            downvotes = downvotes - CASE WHEN OLD.vote_type = 'down' THEN 1 ELSE 0 END,
            neutral_votes = neutral_votes - CASE WHEN OLD.vote_type = 'neutral' THEN 1 ELSE 0 END,
            last_vote_timestamp = now()
        WHERE id = OLD.product_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for rankings
CREATE MATERIALIZED VIEW product_rankings AS
WITH review_scores AS (
    SELECT 
        product_id,
        AVG(rating) as avg_rating,
        COUNT(*) as review_count,
        MAX(created_at) as last_review
    FROM reviews
    GROUP BY product_id
),
vote_scores AS (
    SELECT 
        p.id as product_id,
        p.upvotes,
        p.downvotes,
        p.neutral_votes,
        CASE 
            WHEN (p.upvotes + p.downvotes) = 0 THEN 0
            ELSE (p.upvotes::float / (p.upvotes + p.downvotes))::numeric(5,4)
        END as controversy_score,
        p.last_vote_timestamp
    FROM products p
)
SELECT 
    p.id,
    p.name,
    p.brand,
    p.category,
    COALESCE(r.avg_rating, 0) as review_score,
    COALESCE(r.review_count, 0) as review_count,
    v.upvotes,
    v.downvotes,
    v.neutral_votes,
    v.controversy_score,
    GREATEST(v.last_vote_timestamp, r.last_review, p.created_at) as last_activity,
    (
        COALESCE(r.avg_rating * 0.4, 0) + 
        (v.upvotes - v.downvotes)::numeric * 0.4 +
        LEAST(COALESCE(r.review_count, 0), 100) * 0.2
    ) as score
FROM 
    products p
    LEFT JOIN review_scores r ON p.id = r.product_id
    LEFT JOIN vote_scores v ON p.id = v.product_id
ORDER BY score DESC;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_product_rankings_id ON product_rankings (id);

-- Create function to refresh rankings
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_vote_counts_trigger
    AFTER INSERT OR UPDATE OR DELETE ON product_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_vote_counts();

CREATE TRIGGER refresh_rankings_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON product_votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_rankings();

CREATE TRIGGER refresh_rankings_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_rankings();

-- Create indexes for better performance
CREATE INDEX idx_products_url_slug ON products(url_slug);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_product_votes_product_user ON product_votes(product_id, user_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_product_rankings_score ON product_rankings (score DESC);

-- End of schema setup
COMMIT; 
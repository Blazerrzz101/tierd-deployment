-- Enable better error reporting
SET client_min_messages TO notice;

-- Start transaction
BEGIN;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.product_rankings;

-- Drop all existing functions first
DO $$ 
BEGIN
    -- Drop functions
    DROP FUNCTION IF EXISTS public.refresh_product_rankings() CASCADE;
    DROP FUNCTION IF EXISTS public.update_rankings_on_vote() CASCADE;
    DROP FUNCTION IF EXISTS public.update_rankings_on_review() CASCADE;
    DROP FUNCTION IF EXISTS public.refresh_rankings() CASCADE;
    DROP FUNCTION IF EXISTS public.get_product_details(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.get_product_rankings(TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.handle_anonymous_vote(UUID, TEXT, TEXT) CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_votes(UUID) CASCADE;
    DROP FUNCTION IF EXISTS public.get_user_votes() CASCADE;
    
    -- Drop types
    DROP TYPE IF EXISTS product_result CASCADE;
EXCEPTION 
    WHEN OTHERS THEN 
        RAISE NOTICE 'Error dropping functions: %', SQLERRM;
END $$;

-- Create extension for IP-based rate limiting
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create products table
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    price DECIMAL(10,2),
    image_url TEXT,
    url_slug TEXT UNIQUE NOT NULL,
    specifications JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create votes table
CREATE TABLE public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(product_id, user_id)
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    pros TEXT[] DEFAULT '{}',
    cons TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, user_id)
);

-- Create materialized view for product rankings
CREATE MATERIALIZED VIEW IF NOT EXISTS public.product_rankings AS
WITH vote_counts AS (
    SELECT 
        product_id,
        COUNT(CASE WHEN vote_type = 1 THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = -1 THEN 1 END) as downvotes,
        COUNT(*) as total_votes
    FROM public.votes
    GROUP BY product_id
),
review_stats AS (
    SELECT 
        product_id,
        AVG(rating) as avg_rating,
        COUNT(*) as review_count
    FROM public.reviews
    GROUP BY product_id
)
SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    p.image_url,
    p.url_slug,
    p.specifications,
    COALESCE(vc.upvotes, 0) as upvotes,
    COALESCE(vc.downvotes, 0) as downvotes,
    COALESCE(vc.total_votes, 0) as total_votes,
    COALESCE(rs.avg_rating, 0) as rating,
    COALESCE(rs.review_count, 0) as review_count,
    COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0) as score,
    (
        (COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0)) * 0.7 +
        (COALESCE(rs.avg_rating, 0) * COALESCE(rs.review_count, 0)) * 0.3
    ) as ranking_score,
    RANK() OVER (
        ORDER BY (
            (COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0)) * 0.7 +
            (COALESCE(rs.avg_rating, 0) * COALESCE(rs.review_count, 0)) * 0.3
        ) DESC,
        p.created_at DESC
    ) as rank
FROM public.products p
LEFT JOIN vote_counts vc ON p.id = vc.product_id
LEFT JOIN review_stats rs ON p.id = rs.product_id;

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_rankings_id ON public.product_rankings(id);
CREATE INDEX IF NOT EXISTS idx_votes_product_type ON public.votes(product_id, vote_type);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON public.reviews(product_id, rating);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_url_slug ON public.products(url_slug);

-- Create function to refresh rankings
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_rankings;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for vote changes
CREATE TRIGGER refresh_rankings_vote
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_product_rankings();

-- Create triggers for review changes
CREATE TRIGGER refresh_rankings_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_product_rankings();

-- Create function to handle authenticated votes
CREATE OR REPLACE FUNCTION public.handle_authenticated_vote(
    p_product_id UUID,
    p_vote_type TEXT,
    p_user_id UUID
) RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_vote_value INTEGER;
    v_result JSONB;
BEGIN
    -- Convert vote_type to integer
    v_vote_value := CASE 
        WHEN p_vote_type = 'upvote' THEN 1
        WHEN p_vote_type = 'downvote' THEN -1
        ELSE NULL
    END;

    -- Validate vote_type
    IF v_vote_value IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid vote type. Must be upvote or downvote.'
        );
    END IF;

    -- Validate product exists
    IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Product not found.'
        );
    END IF;

    BEGIN
        -- Insert or update vote
        INSERT INTO public.votes (product_id, user_id, vote_type)
        VALUES (p_product_id, p_user_id, v_vote_value)
        ON CONFLICT (product_id, user_id) 
        DO UPDATE SET 
            vote_type = EXCLUDED.vote_type,
            updated_at = NOW()
        RETURNING jsonb_build_object(
            'success', true,
            'vote_id', id::text,
            'vote_type', vote_type,
            'created_at', created_at,
            'updated_at', updated_at
        ) INTO v_result;

        RETURN v_result;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', SQLERRM
            );
    END;
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_rankings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_authenticated_vote(UUID, TEXT, UUID) TO authenticated;

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT
TO public
USING (true);

CREATE POLICY "Votes are viewable by everyone"
ON public.votes FOR SELECT
TO public
USING (true);

CREATE POLICY "Authenticated users can vote"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
ON public.votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
ON public.votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create reviews"
ON public.reviews FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Initial refresh of the materialized view
REFRESH MATERIALIZED VIEW public.product_rankings;

COMMIT; 
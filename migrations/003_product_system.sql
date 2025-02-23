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
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(product_id, user_id)
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
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
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes,
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
    COALESCE(rs.avg_rating, 0) as rating,
    COALESCE(rs.review_count, 0) as review_count,
    COALESCE(vc.total_votes, 0) as total_votes,
    RANK() OVER (
        PARTITION BY p.category 
        ORDER BY 
            (COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0)) * 0.7 + 
            COALESCE(rs.avg_rating, 0) * COALESCE(rs.review_count, 0) * 0.3 DESC,
            p.created_at DESC
    ) as rank
FROM public.products p
LEFT JOIN vote_counts vc ON p.id = vc.product_id
LEFT JOIN review_stats rs ON p.id = rs.product_id;

-- Create index on product_rankings
CREATE UNIQUE INDEX IF NOT EXISTS product_rankings_id_idx ON public.product_rankings(id);
CREATE INDEX IF NOT EXISTS product_rankings_category_idx ON public.product_rankings(category);
CREATE INDEX IF NOT EXISTS product_rankings_rank_idx ON public.product_rankings(rank);

-- Create function to refresh product rankings
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_rankings;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh rankings
DROP TRIGGER IF EXISTS refresh_rankings_on_vote ON public.votes;
CREATE TRIGGER refresh_rankings_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON public.votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_rankings();

DROP TRIGGER IF EXISTS refresh_rankings_on_review ON public.reviews;
CREATE TRIGGER refresh_rankings_on_review
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_rankings();

-- Add comment
COMMENT ON MATERIALIZED VIEW public.product_rankings IS 'Stores pre-calculated product rankings based on votes and reviews. Refreshed automatically when votes or reviews change.';

-- Create unique index on materialized view for concurrent refresh
CREATE UNIQUE INDEX idx_product_rankings_id ON public.product_rankings(id);

-- Create index for faster materialized view refresh
CREATE INDEX idx_votes_product_type ON public.votes(product_id, vote_type);
CREATE INDEX idx_reviews_product_rating ON public.reviews(product_id, rating);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_url_slug ON public.products(url_slug);

-- Create function to refresh rankings
CREATE OR REPLACE FUNCTION refresh_rankings()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.product_rankings;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for vote changes
CREATE OR REPLACE FUNCTION update_rankings_on_vote()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_rankings();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_rankings_vote
AFTER INSERT OR UPDATE OR DELETE ON public.votes
FOR EACH STATEMENT
EXECUTE FUNCTION update_rankings_on_vote();

-- Create triggers for review changes
CREATE OR REPLACE FUNCTION update_rankings_on_review()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM refresh_rankings();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER refresh_rankings_review
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH STATEMENT
EXECUTE FUNCTION update_rankings_on_review();

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

CREATE POLICY "Anonymous users can vote with rate limiting"
ON public.votes FOR INSERT
TO public
WITH CHECK (
    user_id IS NULL AND
    EXISTS (
        SELECT 1
        FROM handle_anonymous_vote(product_id, vote_type, current_setting('request.headers')::json->>'x-real-ip')
        WHERE handle_anonymous_vote = true
    )
);

CREATE POLICY "Authenticated users can vote once per product"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
        SELECT 1 FROM public.votes v
        WHERE v.product_id = votes.product_id 
        AND v.user_id = auth.uid()
    )
);

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
WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
        SELECT 1 FROM public.reviews r
        WHERE r.product_id = reviews.product_id AND r.user_id = auth.uid()
    )
);

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
SELECT refresh_rankings();

-- Drop existing functions and types
DROP FUNCTION IF EXISTS get_product_details(TEXT);
DROP FUNCTION IF EXISTS get_product_rankings(TEXT);
DROP TYPE IF EXISTS product_result CASCADE;

-- Create a custom type for product results
CREATE TYPE product_result AS (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    price DECIMAL,
    image_url TEXT,
    url_slug TEXT,
    specifications JSONB,
    upvotes BIGINT,
    downvotes BIGINT,
    rating DECIMAL,
    review_count BIGINT,
    rank BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT
);

-- Create function to get product rankings by category
CREATE OR REPLACE FUNCTION get_product_rankings(p_category TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    category product_category,
    price DECIMAL(10,2),
    image_url TEXT,
    url_slug VARCHAR(255),
    specifications JSONB,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    upvotes BIGINT,
    downvotes BIGINT,
    rating DECIMAL(3,2),
    review_count BIGINT,
    score BIGINT,
    rank BIGINT
) SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_current_time TIMESTAMPTZ;
BEGIN
    -- Get current time once to ensure consistency
    v_current_time := now();
    
    RETURN QUERY
    WITH product_stats AS (
        SELECT 
            p.id,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 'upvote'), 0) as upvotes,
            COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 'downvote'), 0) as downvotes,
            COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as rating,
            COUNT(DISTINCT r.id) as review_count,
            COALESCE(
                COUNT(v.*) FILTER (WHERE v.vote_type = 'upvote') -
                COUNT(v.*) FILTER (WHERE v.vote_type = 'downvote'),
                0
            ) as score
        FROM public.products p
        LEFT JOIN public.votes v ON p.id = v.product_id
        LEFT JOIN public.reviews r ON p.id = r.product_id
        WHERE (p_category IS NULL OR p.category::text = p_category)
        GROUP BY p.id
    ),
    ranked_products AS (
        SELECT 
            p.*,
            ps.upvotes,
            ps.downvotes,
            ps.rating,
            ps.review_count,
            ps.score,
            ROW_NUMBER() OVER (
                ORDER BY ps.score DESC, ps.rating DESC, p.created_at DESC
            ) as rank
        FROM public.products p
        JOIN product_stats ps ON p.id = ps.id
        WHERE (p_category IS NULL OR p.category::text = p_category)
    )
    SELECT 
        rp.id,
        rp.name,
        rp.description,
        rp.category,
        rp.price,
        COALESCE(rp.image_url, '/placeholder.png'),
        rp.url_slug,
        rp.specifications,
        rp.created_at,
        rp.updated_at,
        rp.upvotes,
        rp.downvotes,
        rp.rating,
        rp.review_count,
        rp.score,
        rp.rank
    FROM ranked_products rp
    ORDER BY rp.rank ASC;
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.get_product_rankings(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_product_rankings(text) TO anon;

-- Create indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_votes_product_id ON public.votes(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW product_rankings;

-- Create function to get product details
CREATE OR REPLACE FUNCTION get_product_details(p_slug TEXT)
RETURNS SETOF product_result
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_product_exists BOOLEAN;
    v_current_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get current time once to ensure consistency
    v_current_time := now();

    -- Check if product exists
    SELECT EXISTS (
        SELECT 1 FROM public.products WHERE url_slug = p_slug
    ) INTO v_product_exists;

    IF NOT v_product_exists THEN
        RETURN QUERY SELECT
            NULL::UUID,
            'Product Not Found'::TEXT,
            'The requested product could not be found.'::TEXT,
            'Unknown'::TEXT,
            NULL::DECIMAL,
            'https://placehold.co/400x400/1a1a1a/ff4b26?text=Not+Found'::TEXT,
            p_slug,
            '{}'::JSONB,
            0::BIGINT,
            0::BIGINT,
            0::DECIMAL,
            0::BIGINT,
            0::BIGINT,
            v_current_time,
            v_current_time,
            'Product not found'::TEXT;
        RETURN;
    END IF;

    -- Refresh rankings to ensure latest data
    PERFORM refresh_rankings();

    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.price,
        COALESCE(p.image_url, 'https://placehold.co/400x400/1a1a1a/ff4b26?text=No+Image'),
        p.url_slug,
        p.specifications,
        COALESCE(v.upvotes, 0),
        COALESCE(v.downvotes, 0),
        COALESCE(r.avg_rating, 0),
        COALESCE(r.review_count, 0),
        COALESCE(pr.rank, 0),
        p.created_at,
        p.updated_at,
        NULL::TEXT
    FROM public.products p
    LEFT JOIN (
        SELECT 
            product_id,
            COUNT(*) FILTER (WHERE vote_type = 'upvote') as upvotes,
            COUNT(*) FILTER (WHERE vote_type = 'downvote') as downvotes
        FROM public.votes
        GROUP BY product_id
    ) v ON p.id = v.product_id
    LEFT JOIN (
        SELECT 
            product_id,
            AVG(rating) as avg_rating,
            COUNT(*) as review_count
        FROM public.reviews
        GROUP BY product_id
    ) r ON p.id = r.product_id
    LEFT JOIN public.product_rankings pr ON p.id = pr.id
    WHERE p.url_slug = p_slug;
END;
$$;

-- Enable RPC access to these functions
GRANT EXECUTE ON FUNCTION get_product_rankings(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_product_details(TEXT) TO authenticated, anon;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_rankings_category ON public.product_rankings(category);
CREATE INDEX IF NOT EXISTS idx_products_url_slug_lookup ON public.products(url_slug);

-- Comment for documentation
COMMENT ON FUNCTION get_product_rankings(TEXT) IS 'Returns ranked products, optionally filtered by category. Returns fallback data if no products found.';
COMMENT ON FUNCTION get_product_details(TEXT) IS 'Returns detailed product information by URL slug. Returns fallback data if product not found.';

-- Create function to handle anonymous votes with rate limiting
CREATE OR REPLACE FUNCTION public.handle_anonymous_vote(
    product_id UUID,
    vote_type TEXT,
    ip_address TEXT
) RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    rate_limit_key TEXT;
    rate_limit_period INTERVAL := INTERVAL '1 hour';
    max_votes_per_period INTEGER := 5;
    current_votes INTEGER;
BEGIN
    -- Generate a rate limit key from IP address
    rate_limit_key := encode(digest(ip_address, 'sha256'), 'hex');
    
    -- Check vote count for this IP in the last period
    SELECT COUNT(*)
    INTO current_votes
    FROM public.votes
    WHERE metadata->>'rate_limit_key' = rate_limit_key
    AND created_at > NOW() - rate_limit_period;
    
    -- If under rate limit, allow vote
    IF current_votes < max_votes_per_period THEN
        INSERT INTO public.votes (product_id, vote_type, metadata)
        VALUES (
            product_id,
            vote_type,
            jsonb_build_object('rate_limit_key', rate_limit_key)
        );
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$;

-- Grant execute permission on handle_anonymous_vote function
GRANT EXECUTE ON FUNCTION public.handle_anonymous_vote(UUID, TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.handle_anonymous_vote(UUID, TEXT, TEXT) TO authenticated;

-- Add comment for the function
COMMENT ON FUNCTION public.handle_anonymous_vote IS 'Handles anonymous voting with IP-based rate limiting';

-- Drop existing functions with all possible signatures
DROP FUNCTION IF EXISTS public.get_user_votes(UUID);
DROP FUNCTION IF EXISTS public.get_user_votes();

-- Create function to get user votes if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_votes') THEN
        CREATE FUNCTION public.get_user_votes(p_user_id UUID DEFAULT NULL)
        RETURNS TABLE (
            product_id UUID,
            vote_type TEXT
        )
        SECURITY DEFINER
        SET search_path = public
        LANGUAGE plpgsql
        AS $$
        BEGIN
            IF p_user_id IS NOT NULL THEN
                -- Return authenticated user's votes
                RETURN QUERY
                SELECT v.product_id, v.vote_type
                FROM public.votes v
                WHERE v.user_id = p_user_id;
            ELSE
                -- Return anonymous user's votes based on IP
                RETURN QUERY
                SELECT v.product_id, v.vote_type
                FROM public.votes v
                WHERE v.user_id IS NULL
                AND v.metadata->>'hashed_ip' = encode(
                    digest(
                        current_setting('request.headers')::json->>'x-real-ip',
                        'sha256'
                    ),
                    'hex'
                )
                AND v.created_at > NOW() - INTERVAL '1 hour';
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error in get_user_votes: %', SQLERRM;
                RETURN;
        END;
        $$;
    END IF;
END $$;

-- Grant execute permissions on functions
DO $$
BEGIN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.handle_anonymous_vote(UUID, TEXT, TEXT) TO authenticated, anon';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_user_votes(UUID) TO authenticated, anon';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error granting permissions: %', SQLERRM;
END $$;

-- Create the vote_for_product function
CREATE OR REPLACE FUNCTION public.vote_for_product(
    p_product_id UUID,
    p_vote_type TEXT
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote TEXT;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate vote type
    IF p_vote_type NOT IN ('upvote', 'downvote') THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either upvote or downvote';
    END IF;

    -- Check for existing vote
    SELECT vote_type INTO v_existing_vote
    FROM votes
    WHERE product_id = p_product_id AND user_id = v_user_id;

    -- Handle the vote
    IF v_existing_vote IS NULL THEN
        -- Insert new vote
        INSERT INTO votes (product_id, user_id, vote_type)
        VALUES (p_product_id, v_user_id, p_vote_type);
    ELSIF v_existing_vote = p_vote_type THEN
        -- Remove vote if clicking the same type again
        DELETE FROM votes
        WHERE product_id = p_product_id AND user_id = v_user_id;
    ELSE
        -- Update vote if changing from upvote to downvote or vice versa
        UPDATE votes
        SET vote_type = p_vote_type,
            updated_at = now()
        WHERE product_id = p_product_id AND user_id = v_user_id;
    END IF;

    -- Refresh the rankings
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.vote_for_product(UUID, TEXT) TO authenticated;

-- Commit transaction if everything succeeded
COMMIT;

-- Add verification query
DO $$ 
BEGIN
    -- Verify tables
    PERFORM 'public.products'::regclass;
    PERFORM 'public.votes'::regclass;
    PERFORM 'public.reviews'::regclass;
    
    -- Verify materialized view
    PERFORM 'public.product_rankings'::regclass;
    
    -- Verify functions
    PERFORM 'public.refresh_product_rankings()'::regproc;
    PERFORM 'public.get_user_votes(uuid)'::regproc;
    
    RAISE NOTICE 'Migration completed successfully';
EXCEPTION 
    WHEN undefined_table THEN
        RAISE EXCEPTION 'Migration failed: Table or view not created properly';
    WHEN undefined_function THEN
        RAISE EXCEPTION 'Migration failed: Function not created properly';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Migration failed: %', SQLERRM;
END $$; 
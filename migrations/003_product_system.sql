-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.votes CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.product_rankings;

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
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
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

-- Create product_rankings materialized view
CREATE MATERIALIZED VIEW public.product_rankings AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    p.image_url,
    p.url_slug,
    p.specifications,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(r.avg_rating, 0) as rating,
    COALESCE(r.review_count, 0) as review_count,
    RANK() OVER (
        PARTITION BY p.category 
        ORDER BY (COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0)) DESC, 
                COALESCE(r.avg_rating, 0) DESC
    ) as rank
FROM 
    public.products p
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
) r ON p.id = r.product_id;

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

CREATE POLICY "Users can vote once per product"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
        SELECT 1 FROM public.votes v
        WHERE v.product_id = votes.product_id AND v.user_id = auth.uid()
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
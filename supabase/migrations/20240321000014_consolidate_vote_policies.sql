-- Drop triggers first
DROP TRIGGER IF EXISTS refresh_product_rankings_on_vote ON public.votes;
DROP TRIGGER IF EXISTS refresh_product_rankings_on_review ON public.reviews;

-- Drop materialized view that depends on votes
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Create votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create thread_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.thread_votes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id uuid REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
    -- Drop existing policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.votes;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.votes;
    DROP POLICY IF EXISTS "Enable update for vote owners" ON public.votes;
    DROP POLICY IF EXISTS "Enable delete for vote owners" ON public.votes;
    
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.thread_votes;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.thread_votes;
    DROP POLICY IF EXISTS "Enable update for vote owners" ON public.thread_votes;
    DROP POLICY IF EXISTS "Enable delete for vote owners" ON public.thread_votes;
    
    -- Drop check constraints if they exist
    ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;
    ALTER TABLE public.thread_votes DROP CONSTRAINT IF EXISTS thread_votes_vote_type_check;
    
    -- Update vote_type values based on current type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'votes' 
               AND column_name = 'vote_type' 
               AND data_type = 'integer') THEN
        -- First convert to text, then map values
        ALTER TABLE public.votes ALTER COLUMN vote_type TYPE text USING 
            CASE vote_type 
                WHEN 1 THEN 'up'::text
                WHEN -1 THEN 'down'::text
                ELSE vote_type::text
            END;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'thread_votes' 
               AND column_name = 'vote_type' 
               AND data_type = 'integer') THEN
        -- First convert to text, then map values
        ALTER TABLE public.thread_votes ALTER COLUMN vote_type TYPE text USING 
            CASE vote_type 
                WHEN 1 THEN 'up'::text
                WHEN -1 THEN 'down'::text
                ELSE vote_type::text
            END;
    END IF;
    
    -- Add check constraints
    ALTER TABLE public.votes ADD CONSTRAINT votes_vote_type_check 
        CHECK (vote_type IN ('up', 'down'));
    ALTER TABLE public.thread_votes ADD CONSTRAINT thread_votes_vote_type_check 
        CHECK (vote_type IN ('up', 'down'));
END $$;

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for votes table
CREATE POLICY "Enable read access for all users"
    ON public.votes FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON public.votes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for vote owners"
    ON public.votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for vote owners"
    ON public.votes FOR DELETE
    USING (auth.uid() = user_id);

-- Create policies for thread_votes table
CREATE POLICY "Enable read access for all users"
    ON public.thread_votes FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users only"
    ON public.thread_votes FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for vote owners"
    ON public.thread_votes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete for vote owners"
    ON public.thread_votes FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.votes TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO authenticated;
GRANT SELECT ON public.thread_votes TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thread_votes TO authenticated;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for votes
DROP TRIGGER IF EXISTS update_votes_updated_at ON public.votes;
CREATE TRIGGER update_votes_updated_at
    BEFORE UPDATE ON public.votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for thread_votes
DROP TRIGGER IF EXISTS update_thread_votes_updated_at ON public.thread_votes;
CREATE TRIGGER update_thread_votes_updated_at
    BEFORE UPDATE ON public.thread_votes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate materialized view
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_counts AS (
    SELECT 
        product_id,
        COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes
    FROM votes
    GROUP BY product_id
),
review_stats AS (
    SELECT 
        product_id,
        COUNT(*) as review_count,
        COALESCE(AVG(rating), 0) as avg_rating
    FROM reviews
    GROUP BY product_id
)
SELECT 
    p.id as product_id,
    p.name,
    p.url_slug,
    p.description,
    p.created_at,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(r.review_count, 0) as review_count,
    COALESCE(r.avg_rating, 0) as avg_rating,
    (COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0)) * 10 + 
    COALESCE(r.review_count, 0) * 2 + 
    COALESCE(r.avg_rating, 0) * 5 as ranking_score
FROM products p
LEFT JOIN vote_counts v ON p.id = v.product_id
LEFT JOIN review_stats r ON p.id = r.product_id;

-- Create index on ranking score
CREATE INDEX IF NOT EXISTS idx_product_rankings_score ON product_rankings (ranking_score DESC);

-- Create refresh function
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh rankings
CREATE TRIGGER refresh_product_rankings_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_rankings();

CREATE TRIGGER refresh_product_rankings_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH STATEMENT
    EXECUTE FUNCTION refresh_product_rankings(); 
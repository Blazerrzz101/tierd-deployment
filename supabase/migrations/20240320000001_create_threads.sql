-- Create threads tables and functions

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.thread_votes CASCADE;
DROP TABLE IF EXISTS public.thread_products CASCADE;
DROP TABLE IF EXISTS public.threads CASCADE;

-- Create threads table
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    mentioned_products UUID[] DEFAULT ARRAY[]::UUID[],
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    is_private BOOLEAN DEFAULT false
);

-- Create thread_products junction table
CREATE TABLE IF NOT EXISTS public.thread_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(thread_id, product_id)
);

-- Create thread_votes table
CREATE TABLE IF NOT EXISTS public.thread_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type INTEGER CHECK (vote_type IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_threads_user_id ON public.threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_created_at ON public.threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_products_thread_id ON public.thread_products(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_products_product_id ON public.thread_products(product_id);
CREATE INDEX IF NOT EXISTS idx_thread_votes_thread_id ON public.thread_votes(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_votes_user_id ON public.thread_votes(user_id);

-- Enable RLS
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Threads are viewable by everyone" ON public.threads;

-- Create updated policies
CREATE POLICY "Users can view their own private threads"
ON public.threads FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id 
    AND is_private = true
);

CREATE POLICY "Product threads are viewable by everyone"
ON public.threads FOR SELECT
TO public
USING (
    is_private = false 
    AND EXISTS (
        SELECT 1 FROM thread_products tp 
        WHERE tp.thread_id = threads.id
    )
);

CREATE POLICY "Users can create threads"
ON public.threads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
ON public.threads FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Thread products are viewable by everyone"
ON public.thread_products FOR SELECT
TO public
USING (true);

CREATE POLICY "Thread votes are viewable by everyone"
ON public.thread_votes FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can vote on threads"
ON public.thread_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their votes"
ON public.thread_votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.threads TO anon, authenticated;
GRANT SELECT ON public.thread_products TO anon, authenticated;
GRANT SELECT ON public.thread_votes TO anon, authenticated;
GRANT INSERT, UPDATE ON public.threads TO authenticated;
GRANT INSERT ON public.thread_products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.thread_votes TO authenticated;

-- Create function to handle vote updates
CREATE OR REPLACE FUNCTION handle_thread_vote()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE threads
        SET 
            upvotes = CASE WHEN NEW.vote_type = 1 THEN upvotes + 1 ELSE upvotes END,
            downvotes = CASE WHEN NEW.vote_type = -1 THEN downvotes + 1 ELSE downvotes END
        WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE threads
        SET 
            upvotes = CASE WHEN OLD.vote_type = 1 THEN upvotes - 1 ELSE upvotes END,
            downvotes = CASE WHEN OLD.vote_type = -1 THEN downvotes - 1 ELSE downvotes END
        WHERE id = OLD.thread_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.vote_type != NEW.vote_type THEN
        UPDATE threads
        SET 
            upvotes = CASE 
                WHEN OLD.vote_type = 1 THEN upvotes - 1
                WHEN NEW.vote_type = 1 THEN upvotes + 1
                ELSE upvotes
            END,
            downvotes = CASE 
                WHEN OLD.vote_type = -1 THEN downvotes - 1
                WHEN NEW.vote_type = -1 THEN downvotes + 1
                ELSE downvotes
            END
        WHERE id = NEW.thread_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for vote updates
CREATE TRIGGER thread_vote_trigger
AFTER INSERT OR UPDATE OR DELETE ON thread_votes
FOR EACH ROW
EXECUTE FUNCTION handle_thread_vote();

-- Create function to get thread details
CREATE OR REPLACE FUNCTION get_thread_details(p_thread_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    user_id UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    upvotes INTEGER,
    downvotes INTEGER,
    mentioned_products UUID[],
    is_pinned BOOLEAN,
    is_locked BOOLEAN,
    is_private BOOLEAN,
    user_name TEXT,
    user_avatar TEXT,
    products JSONB
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the thread is accessible to the current user
    IF NOT EXISTS (
        SELECT 1 FROM threads t
        WHERE t.id = p_thread_id
        AND (
            -- Public thread with product association
            (NOT t.is_private AND EXISTS (
                SELECT 1 FROM thread_products tp 
                WHERE tp.thread_id = t.id
            ))
            OR 
            -- Private thread owned by the current user
            (t.is_private AND t.user_id = auth.uid())
        )
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        t.*,
        up.username::TEXT as user_name,
        up.avatar_url::TEXT as user_avatar,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', p.id,
                    'name', p.name,
                    'url_slug', p.url_slug,
                    'category', p.category
                )
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::jsonb
        ) as products
    FROM threads t
    LEFT JOIN user_profiles up ON t.user_id = up.id
    LEFT JOIN thread_products tp ON t.id = tp.thread_id
    LEFT JOIN products p ON tp.product_id = p.id
    WHERE t.id = p_thread_id
    GROUP BY t.id, up.username, up.avatar_url;
END;
$$;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION get_thread_details(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION handle_thread_vote() TO authenticated;

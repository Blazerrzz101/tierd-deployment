-- Create threads table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    mentioned_products UUID[] DEFAULT ARRAY[]::UUID[],
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false
);

-- Create thread_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.thread_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.thread_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0
);

-- Create thread_products table for product mentions if it doesn't exist
CREATE TABLE IF NOT EXISTS public.thread_products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(thread_id, product_id)
);

-- Create thread_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.thread_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(thread_id, user_id)
);

-- Create comment_votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.comment_votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    comment_id UUID REFERENCES public.thread_comments(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(comment_id, user_id)
);

-- Enable RLS if not already enabled
DO $$ 
BEGIN
    -- Enable RLS for each table
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'threads' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'thread_comments' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.thread_comments ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'thread_products' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.thread_products ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'thread_votes' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.thread_votes ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE tablename = 'comment_votes' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create or replace RLS policies
DO $$ 
BEGIN
    -- Threads policies
    DROP POLICY IF EXISTS "Anyone can view threads" ON public.threads;
    CREATE POLICY "Anyone can view threads"
        ON public.threads FOR SELECT
        USING (true);

    DROP POLICY IF EXISTS "Authenticated users can create threads" ON public.threads;
    CREATE POLICY "Authenticated users can create threads"
        ON public.threads FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own threads" ON public.threads;
    CREATE POLICY "Users can update their own threads"
        ON public.threads FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own threads" ON public.threads;
    CREATE POLICY "Users can delete their own threads"
        ON public.threads FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);

    -- Comments policies
    DROP POLICY IF EXISTS "Anyone can view comments" ON public.thread_comments;
    CREATE POLICY "Anyone can view comments"
        ON public.thread_comments FOR SELECT
        USING (true);

    DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.thread_comments;
    CREATE POLICY "Authenticated users can create comments"
        ON public.thread_comments FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own comments" ON public.thread_comments;
    CREATE POLICY "Users can update their own comments"
        ON public.thread_comments FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own comments" ON public.thread_comments;
    CREATE POLICY "Users can delete their own comments"
        ON public.thread_comments FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);

    -- Thread products policies
    DROP POLICY IF EXISTS "Anyone can view thread_products" ON public.thread_products;
    CREATE POLICY "Anyone can view thread_products"
        ON public.thread_products FOR SELECT
        USING (true);

    DROP POLICY IF EXISTS "Authenticated users can create thread_products" ON public.thread_products;
    CREATE POLICY "Authenticated users can create thread_products"
        ON public.thread_products FOR INSERT
        TO authenticated
        WITH CHECK (EXISTS (
            SELECT 1 FROM public.threads
            WHERE id = thread_id AND user_id = auth.uid()
        ));

    -- Votes policies
    DROP POLICY IF EXISTS "Anyone can view votes" ON public.thread_votes;
    CREATE POLICY "Anyone can view votes"
        ON public.thread_votes FOR SELECT
        USING (true);

    DROP POLICY IF EXISTS "Authenticated users can vote" ON public.thread_votes;
    CREATE POLICY "Authenticated users can vote"
        ON public.thread_votes FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update their own votes" ON public.thread_votes;
    CREATE POLICY "Users can update their own votes"
        ON public.thread_votes FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can delete their own votes" ON public.thread_votes;
    CREATE POLICY "Users can delete their own votes"
        ON public.thread_votes FOR DELETE
        TO authenticated
        USING (auth.uid() = user_id);
END $$;

-- Create or replace function to update thread vote counts
CREATE OR REPLACE FUNCTION update_thread_votes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE threads
    SET 
        upvotes = (
            SELECT COUNT(*) FROM thread_votes
            WHERE thread_id = NEW.thread_id AND vote_type = 'up'
        ),
        downvotes = (
            SELECT COUNT(*) FROM thread_votes
            WHERE thread_id = NEW.thread_id AND vote_type = 'down'
        )
    WHERE id = NEW.thread_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for thread votes
DROP TRIGGER IF EXISTS update_thread_votes_trigger ON thread_votes;
CREATE TRIGGER update_thread_votes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON thread_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_thread_votes();

-- Create or replace function to update comment vote counts
CREATE OR REPLACE FUNCTION update_comment_votes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE thread_comments
    SET 
        upvotes = (
            SELECT COUNT(*) FROM comment_votes
            WHERE comment_id = NEW.comment_id AND vote_type = 'up'
        ),
        downvotes = (
            SELECT COUNT(*) FROM comment_votes
            WHERE comment_id = NEW.comment_id AND vote_type = 'down'
        )
    WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for comment votes
DROP TRIGGER IF EXISTS update_comment_votes_trigger ON comment_votes;
CREATE TRIGGER update_comment_votes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON comment_votes
    FOR EACH ROW
    EXECUTE FUNCTION update_comment_votes();

-- Create indexes if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_threads_user_id') THEN
        CREATE INDEX idx_threads_user_id ON threads(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_thread_comments_thread_id') THEN
        CREATE INDEX idx_thread_comments_thread_id ON thread_comments(thread_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_thread_comments_user_id') THEN
        CREATE INDEX idx_thread_comments_user_id ON thread_comments(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_thread_products_thread_id') THEN
        CREATE INDEX idx_thread_products_thread_id ON thread_products(thread_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_thread_products_product_id') THEN
        CREATE INDEX idx_thread_products_product_id ON thread_products(product_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_thread_votes_thread_id') THEN
        CREATE INDEX idx_thread_votes_thread_id ON thread_votes(thread_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_thread_votes_user_id') THEN
        CREATE INDEX idx_thread_votes_user_id ON thread_votes(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comment_votes_comment_id') THEN
        CREATE INDEX idx_comment_votes_comment_id ON comment_votes(comment_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_comment_votes_user_id') THEN
        CREATE INDEX idx_comment_votes_user_id ON comment_votes(user_id);
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON public.threads TO authenticated;
GRANT ALL ON public.thread_comments TO authenticated;
GRANT ALL ON public.thread_products TO authenticated;
GRANT ALL ON public.thread_votes TO authenticated;
GRANT ALL ON public.comment_votes TO authenticated; 
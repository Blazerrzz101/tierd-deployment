-- Create base tables in correct order
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    mentioned_products TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false
);

-- Create thread_products junction table
CREATE TABLE IF NOT EXISTS public.thread_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(thread_id, product_id)
);

-- Create thread_votes table
CREATE TABLE IF NOT EXISTS public.thread_votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(thread_id, user_id)
);

-- Enable RLS
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.threads
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.threads
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for thread owners" ON public.threads
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Thread products policies
CREATE POLICY "Enable read access for all users" ON public.thread_products
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for thread owners" ON public.thread_products
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.threads
            WHERE id = thread_id AND user_id = auth.uid()
        )
    );

-- Thread votes policies
CREATE POLICY "Enable read access for all users" ON public.thread_votes
    FOR SELECT
    USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.thread_votes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON public.threads TO anon;
GRANT SELECT ON public.threads TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.threads TO authenticated;

GRANT SELECT ON public.thread_products TO anon;
GRANT SELECT ON public.thread_products TO authenticated;
GRANT INSERT, DELETE ON public.thread_products TO authenticated;

GRANT SELECT ON public.thread_votes TO anon;
GRANT SELECT ON public.thread_votes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.thread_votes TO authenticated; 
-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.thread_products CASCADE;
DROP TABLE IF EXISTS public.threads CASCADE;

-- Create threads table with proper foreign key
CREATE TABLE public.threads (
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
CREATE TABLE public.thread_products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    thread_id UUID NOT NULL REFERENCES public.threads(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(thread_id, product_id)
);

-- Create indexes for better performance
CREATE INDEX idx_threads_user_id ON public.threads(user_id);
CREATE INDEX idx_threads_created_at ON public.threads(created_at DESC);
CREATE INDEX idx_thread_products_thread_id ON public.thread_products(thread_id);
CREATE INDEX idx_thread_products_product_id ON public.thread_products(product_id);

-- Enable RLS
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_products ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Enable delete for thread owners" ON public.threads
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

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

CREATE POLICY "Enable delete for thread owners" ON public.thread_products
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.threads
            WHERE id = thread_id AND user_id = auth.uid()
        )
    );

-- Grant permissions
GRANT ALL ON public.threads TO postgres;
GRANT ALL ON public.thread_products TO postgres;

GRANT SELECT ON public.threads TO anon;
GRANT SELECT ON public.threads TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.threads TO authenticated;

GRANT SELECT ON public.thread_products TO anon;
GRANT SELECT ON public.thread_products TO authenticated;
GRANT INSERT, DELETE ON public.thread_products TO authenticated; 
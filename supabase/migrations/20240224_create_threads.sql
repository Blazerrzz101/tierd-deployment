-- Drop existing tables if they exist
DROP TABLE IF EXISTS thread_votes CASCADE;
DROP TABLE IF EXISTS thread_products CASCADE;
DROP TABLE IF EXISTS thread_comments CASCADE;
DROP TABLE IF EXISTS threads CASCADE;

-- Create threads table
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    mentioned_products UUID[] DEFAULT ARRAY[]::UUID[],
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false
);

-- Create thread_products junction table
CREATE TABLE thread_products (
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (thread_id, product_id)
);

-- Create thread_votes table
CREATE TABLE thread_votes (
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (thread_id, user_id)
);

-- Create thread_comments table
CREATE TABLE thread_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to threads"
    ON threads FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow authenticated users to create threads"
    ON threads FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow thread owners to update their threads"
    ON threads FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow thread owners to delete their threads"
    ON threads FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT ON threads TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON threads TO authenticated;

GRANT SELECT ON thread_products TO anon, authenticated;
GRANT INSERT, DELETE ON thread_products TO authenticated;

GRANT SELECT ON thread_votes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON thread_votes TO authenticated;

GRANT SELECT ON thread_comments TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON thread_comments TO authenticated; 
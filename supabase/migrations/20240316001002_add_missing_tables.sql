-- Add missing tables

-- Create activities table
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    activity_type TEXT NOT NULL,
    target_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create threads table
CREATE TABLE threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    user_id UUID NOT NULL,
    mentioned_products UUID[] DEFAULT '{}',
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create thread_comments table
CREATE TABLE thread_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES thread_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create thread_products table
CREATE TABLE thread_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(thread_id, product_id)
);

-- Create thread_votes table
CREATE TABLE thread_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(thread_id, user_id)
);

-- Create user_preferences table
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    theme TEXT DEFAULT 'dark',
    email_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, target_type, target_id)
);

-- Enable RLS on new tables
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for new tables
CREATE POLICY "Allow public read access to activities"
    ON activities FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public read access to posts"
    ON posts FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public read access to threads"
    ON threads FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public read access to thread_comments"
    ON thread_comments FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public read access to thread_products"
    ON thread_products FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow public read access to thread_votes"
    ON thread_votes FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Allow users to manage their own preferences"
    ON user_preferences FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow public read access to votes"
    ON votes FOR SELECT
    TO public
    USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON activities TO authenticated;
GRANT INSERT, UPDATE, DELETE ON posts TO authenticated;
GRANT INSERT, UPDATE, DELETE ON threads TO authenticated;
GRANT INSERT, UPDATE, DELETE ON thread_comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON thread_products TO authenticated;
GRANT INSERT, UPDATE, DELETE ON thread_votes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON user_preferences TO authenticated;
GRANT INSERT, UPDATE, DELETE ON votes TO authenticated;

-- Add some sample data
INSERT INTO threads (content, user_id)
VALUES 
    ('What do you think about the new Logitech G Pro X Superlight?', gen_random_uuid()),
    ('Best mechanical keyboard for programming?', gen_random_uuid()),
    ('Gaming mice tier list 2024', gen_random_uuid());

-- Add some sample thread comments
INSERT INTO thread_comments (thread_id, user_id, content)
SELECT 
    t.id,
    gen_random_uuid(),
    'This is a great discussion topic!'
FROM threads t
LIMIT 3;

-- Add some sample thread votes
INSERT INTO thread_votes (thread_id, user_id, vote_type)
SELECT 
    t.id,
    gen_random_uuid(),
    CASE WHEN random() > 0.3 THEN 'upvote' ELSE 'downvote' END
FROM threads t
CROSS JOIN generate_series(1, 10);

-- Link products to threads
INSERT INTO thread_products (thread_id, product_id)
SELECT 
    t.id,
    p.id
FROM threads t
CROSS JOIN products p
WHERE p.category = 'gaming-mice'
LIMIT 5; 
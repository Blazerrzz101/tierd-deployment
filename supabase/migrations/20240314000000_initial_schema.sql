-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects if they exist
DROP TABLE IF EXISTS product_votes CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TYPE IF EXISTS product_category CASCADE;
DROP TYPE IF EXISTS vote_type CASCADE;
DROP TYPE IF EXISTS activity_type CASCADE;

-- Create category enum type
CREATE TYPE product_category AS ENUM (
    'gaming-mice',
    'gaming-keyboards',
    'gaming-headsets',
    'gaming-monitors'
);

-- Create vote type enum
CREATE TYPE vote_type AS ENUM ('up', 'down');

-- Create activity type enum
CREATE TYPE activity_type AS ENUM ('vote', 'comment', 'review');

-- Create products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    url_slug VARCHAR(255) UNIQUE,
    description TEXT,
    category product_category NOT NULL,
    price DECIMAL(10,2),
    image_url TEXT,
    specifications JSONB,
    votes INTEGER DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create votes table
CREATE TABLE product_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    anonymous_id TEXT, -- For tracking anonymous votes
    vote_type vote_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Ensure a user/anonymous can only have one vote per product
    CONSTRAINT unique_user_vote UNIQUE (product_id, user_id),
    CONSTRAINT unique_anonymous_vote UNIQUE (product_id, anonymous_id),
    -- Ensure either user_id or anonymous_id is set, but not both
    CONSTRAINT user_or_anonymous CHECK (
        (user_id IS NOT NULL AND anonymous_id IS NULL) OR
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    )
);

-- Create threads table
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false
);

-- Create thread_products junction table
CREATE TABLE IF NOT EXISTS thread_products (
    thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (thread_id, product_id)
);

-- Create thread_votes table
CREATE TABLE IF NOT EXISTS thread_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type vote_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(thread_id, user_id)
);

-- Create user activity table
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_url_slug ON products(url_slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_votes ON products(votes DESC);
CREATE INDEX IF NOT EXISTS idx_products_ranking ON products(category, votes DESC);
CREATE INDEX idx_product_votes_product ON product_votes(product_id);
CREATE INDEX idx_product_votes_user ON product_votes(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_product_votes_anonymous ON product_votes(anonymous_id) WHERE anonymous_id IS NOT NULL;
CREATE INDEX idx_user_activities_user ON user_activities(user_id);
CREATE INDEX idx_user_activities_product ON user_activities(product_id) WHERE product_id IS NOT NULL;
CREATE INDEX idx_user_activities_type ON user_activities(activity_type);

-- Create indexes for threads
CREATE INDEX IF NOT EXISTS idx_threads_user ON threads(user_id);
CREATE INDEX IF NOT EXISTS idx_threads_created ON threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_thread_products_thread ON thread_products(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_products_product ON thread_products(product_id);
CREATE INDEX IF NOT EXISTS idx_thread_votes_thread ON thread_votes(thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_votes_user ON thread_votes(user_id);

-- Create product details view
CREATE OR REPLACE VIEW product_details AS
SELECT 
    p.*,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0) as score
FROM products p
LEFT JOIN (
    SELECT 
        product_id,
        COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
        COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
    FROM product_votes
    GROUP BY product_id
) v ON v.product_id = p.id;

-- Function to get user's vote on a product
CREATE OR REPLACE FUNCTION get_user_vote(p_product_id UUID, p_user_id UUID DEFAULT NULL, p_anonymous_id TEXT DEFAULT NULL)
RETURNS TABLE (vote_type vote_type) AS $$
BEGIN
    RETURN QUERY
    SELECT v.vote_type
    FROM product_votes v
    WHERE v.product_id = p_product_id
    AND (
        (p_user_id IS NOT NULL AND v.user_id = p_user_id) OR
        (p_anonymous_id IS NOT NULL AND v.anonymous_id = p_anonymous_id)
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count anonymous votes for the last 24 hours
CREATE OR REPLACE FUNCTION count_anonymous_votes(p_anonymous_id TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM product_votes
        WHERE anonymous_id = p_anonymous_id
        AND created_at > CURRENT_TIMESTAMP - INTERVAL '24 hours'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cast a vote
CREATE OR REPLACE FUNCTION cast_vote(
    p_product_id UUID,
    p_vote_type vote_type,
    p_user_id UUID DEFAULT NULL,
    p_anonymous_id TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_existing_vote vote_type;
    v_anonymous_vote_count INTEGER;
    v_result JSONB;
BEGIN
    -- Validate input
    IF p_product_id IS NULL OR p_vote_type IS NULL THEN
        RAISE EXCEPTION 'Product ID and vote type are required';
    END IF;

    -- Ensure either user_id or anonymous_id is provided, but not both
    IF (p_user_id IS NULL AND p_anonymous_id IS NULL) OR 
       (p_user_id IS NOT NULL AND p_anonymous_id IS NOT NULL) THEN
        RAISE EXCEPTION 'Either user_id or anonymous_id must be provided, but not both';
    END IF;

    -- For anonymous votes, check the 24-hour limit
    IF p_anonymous_id IS NOT NULL THEN
        v_anonymous_vote_count := count_anonymous_votes(p_anonymous_id);
        IF v_anonymous_vote_count >= 5 THEN
            RETURN jsonb_build_object(
                'success', false,
                'message', 'Anonymous vote limit reached',
                'vote_count', v_anonymous_vote_count
            );
        END IF;
    END IF;

    -- Get existing vote
    SELECT v.vote_type INTO v_existing_vote
    FROM product_votes v
    WHERE v.product_id = p_product_id
    AND (
        (p_user_id IS NOT NULL AND v.user_id = p_user_id) OR
        (p_anonymous_id IS NOT NULL AND v.anonymous_id = p_anonymous_id)
    );

    -- Handle the vote
    IF v_existing_vote IS NULL THEN
        -- Insert new vote
        INSERT INTO product_votes (product_id, user_id, anonymous_id, vote_type)
        VALUES (p_product_id, p_user_id, p_anonymous_id, p_vote_type);

        -- Record activity for authenticated users
        IF p_user_id IS NOT NULL THEN
            INSERT INTO user_activities (user_id, activity_type, product_id, details)
            VALUES (p_user_id, 'vote', p_product_id, jsonb_build_object('vote_type', p_vote_type));
        END IF;

        v_result := jsonb_build_object(
            'success', true,
            'message', 'Vote recorded',
            'vote_type', p_vote_type
        );
    ELSIF v_existing_vote = p_vote_type THEN
        -- Remove vote if clicking the same type
        DELETE FROM product_votes
        WHERE product_id = p_product_id
        AND (
            (p_user_id IS NOT NULL AND user_id = p_user_id) OR
            (p_anonymous_id IS NOT NULL AND anonymous_id = p_anonymous_id)
        );

        v_result := jsonb_build_object(
            'success', true,
            'message', 'Vote removed',
            'vote_type', NULL
        );
    ELSE
        -- Update existing vote
        UPDATE product_votes
        SET vote_type = p_vote_type,
            updated_at = CURRENT_TIMESTAMP
        WHERE product_id = p_product_id
        AND (
            (p_user_id IS NOT NULL AND user_id = p_user_id) OR
            (p_anonymous_id IS NOT NULL AND anonymous_id = p_anonymous_id)
        );

        -- Record activity for authenticated users
        IF p_user_id IS NOT NULL THEN
            INSERT INTO user_activities (user_id, activity_type, product_id, details)
            VALUES (p_user_id, 'vote', p_product_id, jsonb_build_object(
                'vote_type', p_vote_type,
                'previous_vote', v_existing_vote
            ));
        END IF;

        v_result := jsonb_build_object(
            'success', true,
            'message', 'Vote updated',
            'vote_type', p_vote_type
        );
    END IF;

    -- Update product vote counts
    WITH vote_counts AS (
        SELECT 
            COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
            COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
        FROM product_votes
        WHERE product_id = p_product_id
    )
    UPDATE products
    SET votes = (SELECT (upvotes - downvotes) FROM vote_counts),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_product_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product details with vote information
CREATE OR REPLACE FUNCTION get_product_details(
    p_slug TEXT,
    p_user_id UUID DEFAULT NULL,
    p_anonymous_id TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    url_slug VARCHAR(255),
    description TEXT,
    category product_category,
    price DECIMAL(10,2),
    image_url TEXT,
    specifications JSONB,
    votes INTEGER,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    related_products JSONB,
    upvotes BIGINT,
    downvotes BIGINT,
    user_vote vote_type
) AS $$
BEGIN
    RETURN QUERY
    WITH vote_info AS (
        SELECT 
            p.*,
            COALESCE(v.upvotes, 0) as upvotes,
            COALESCE(v.downvotes, 0) as downvotes,
            uv.vote_type as user_vote
        FROM products p
        LEFT JOIN (
            SELECT 
                product_id,
                COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
                COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
            FROM product_votes
            GROUP BY product_id
        ) v ON v.product_id = p.id
        LEFT JOIN LATERAL get_user_vote(p.id, p_user_id, p_anonymous_id) uv ON true
        WHERE p.url_slug = p_slug
    ),
    related AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', r.id,
                'name', r.name,
                'url_slug', r.url_slug,
                'price', r.price,
                'votes', r.votes,
                'category', r.category::text
            )
        ) as related_products
        FROM vote_info p
        JOIN products r ON r.category = p.category AND r.id != p.id
        WHERE r.votes > 0
        GROUP BY p.id
    )
    SELECT 
        p.id,
        p.name,
        p.url_slug,
        p.description,
        p.category,
        p.price,
        p.image_url,
        p.specifications,
        p.votes,
        ROW_NUMBER() OVER (
            PARTITION BY p.category 
            ORDER BY p.votes DESC, p.created_at DESC
        )::INTEGER as rank,
        p.created_at,
        p.updated_at,
        COALESCE(r.related_products, '[]'::jsonb),
        p.upvotes,
        p.downvotes,
        p.user_vote
    FROM vote_info p
    LEFT JOIN related r ON true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product rankings with vote information
CREATE OR REPLACE FUNCTION get_product_rankings(
    p_category product_category DEFAULT NULL,
    p_user_id UUID DEFAULT NULL,
    p_anonymous_id TEXT DEFAULT NULL
) RETURNS TABLE (
    id UUID,
    name VARCHAR(255),
    description TEXT,
    category product_category,
    price DECIMAL(10,2),
    image_url TEXT,
    url_slug VARCHAR(255),
    specifications JSONB,
    votes INTEGER,
    rank INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    upvotes BIGINT,
    downvotes BIGINT,
    user_vote vote_type
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.description,
        p.category,
        p.price,
        p.image_url,
        p.url_slug,
        p.specifications,
        p.votes,
        ROW_NUMBER() OVER (
            PARTITION BY p.category 
            ORDER BY p.votes DESC, p.created_at DESC
        )::INTEGER as rank,
        p.created_at,
        p.updated_at,
        COALESCE(v.upvotes, 0) as upvotes,
        COALESCE(v.downvotes, 0) as downvotes,
        uv.vote_type as user_vote
    FROM products p
    LEFT JOIN (
        SELECT 
            product_id,
            COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
            COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
        FROM product_votes
        GROUP BY product_id
    ) v ON v.product_id = p.id
    LEFT JOIN LATERAL get_user_vote(p.id, p_user_id, p_anonymous_id) uv ON true
    WHERE 
        CASE 
            WHEN p_category IS NULL THEN TRUE
            ELSE p.category = p_category
        END
    ORDER BY p.votes DESC, p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view products"
    ON products FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Anyone can view votes"
    ON product_votes FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Authenticated users can vote"
    ON product_votes FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        anonymous_id IS NULL
    );

CREATE POLICY "Anonymous users can vote"
    ON product_votes FOR INSERT
    TO anon
    WITH CHECK (
        user_id IS NULL AND
        anonymous_id IS NOT NULL
    );

CREATE POLICY "Users can update their own votes"
    ON product_votes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
    ON product_votes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities"
    ON user_activities FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to get user activity
CREATE OR REPLACE FUNCTION get_user_activity(p_user_id UUID)
RETURNS TABLE (
    activity_id UUID,
    activity_type activity_type,
    product_name TEXT,
    product_url_slug TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as activity_id,
        a.activity_type,
        p.name as product_name,
        p.url_slug as product_url_slug,
        a.details,
        a.created_at
    FROM user_activities a
    LEFT JOIN products p ON p.id = a.product_id
    WHERE a.user_id = p_user_id
    ORDER BY a.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on new tables
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE thread_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for threads
CREATE POLICY "Anyone can view threads"
    ON threads FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Authenticated users can create threads"
    ON threads FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
    ON threads FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own threads"
    ON threads FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create policies for thread products
CREATE POLICY "Anyone can view thread products"
    ON thread_products FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Thread owners can manage products"
    ON thread_products FOR ALL
    TO authenticated
    USING (
        auth.uid() IN (
            SELECT user_id FROM threads WHERE id = thread_id
        )
    );

-- Create policies for thread votes
CREATE POLICY "Anyone can view thread votes"
    ON thread_votes FOR SELECT
    TO authenticated, anon
    USING (true);

CREATE POLICY "Authenticated users can vote on threads"
    ON thread_votes FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own thread votes"
    ON thread_votes FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thread votes"
    ON thread_votes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create a view for public user data
CREATE OR REPLACE VIEW public.users AS
SELECT 
    id,
    email,
    raw_user_meta_data->>'username' as username,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    created_at,
    updated_at
FROM auth.users;

-- Grant access to the users view
GRANT SELECT ON public.users TO anon, authenticated; 
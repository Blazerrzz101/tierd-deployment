-- Complete backend setup with error handling and product details
DO $$ 
DECLARE
    v_error_message TEXT;
    v_category TEXT;
    v_product_id UUID;
BEGIN
    -- Enable UUID extension if not already enabled
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create error logging table
    CREATE TABLE IF NOT EXISTS error_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        error_message TEXT NOT NULL,
        error_context JSONB,
        created_at TIMESTAMPTZ DEFAULT now(),
        resolved BOOLEAN DEFAULT false
    );

    -- Create function for error logging
    CREATE OR REPLACE FUNCTION log_error(p_error_message TEXT, p_context JSONB DEFAULT '{}'::JSONB)
    RETURNS UUID AS $$
    DECLARE
        v_error_id UUID;
    BEGIN
        INSERT INTO error_logs (error_message, error_context)
        VALUES (p_error_message, p_context)
        RETURNING id INTO v_error_id;
        
        RETURN v_error_id;
    END;
    $$ LANGUAGE plpgsql;

    -- Create products table with comprehensive schema
    CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        url_slug TEXT UNIQUE NOT NULL,
        image_url TEXT,
        details JSONB NOT NULL DEFAULT '{}'::JSONB,
        metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        last_scraped_at TIMESTAMPTZ,
        upvotes INTEGER DEFAULT 0,
        downvotes INTEGER DEFAULT 0,
        neutral_votes INTEGER DEFAULT 0,
        score NUMERIC(10,2) DEFAULT 0,
        controversy_score NUMERIC(5,4) DEFAULT 0,
        last_vote_timestamp TIMESTAMPTZ,
        CONSTRAINT valid_url_slug CHECK (url_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
    );

    -- Create votes table
    CREATE TABLE IF NOT EXISTS votes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        vote_type TEXT CHECK (vote_type IN ('up', 'down')),
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(product_id, user_id)
    );

    -- Create reviews table
    CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        product_id UUID REFERENCES products(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        helpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE(product_id, user_id)
    );

    -- Create categories with predefined options
    CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        icon_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Insert predefined categories
    INSERT INTO categories (id, name, description) 
    VALUES 
        ('gaming-mice', 'Gaming Mice', 'High-performance gaming mice with advanced sensors'),
        ('gaming-keyboards', 'Gaming Keyboards', 'Mechanical and optical gaming keyboards'),
        ('gaming-headsets', 'Gaming Headsets', 'Gaming headsets with surround sound'),
        ('gaming-monitors', 'Gaming Monitors', 'High refresh rate gaming monitors'),
        ('gaming-laptops', 'Gaming Laptops', 'Powerful gaming laptops')
    ON CONFLICT (id) DO NOTHING;

    -- Create materialized view for product rankings
    CREATE MATERIALIZED VIEW IF NOT EXISTS product_rankings AS
    WITH vote_counts AS (
        SELECT 
            p.id,
            p.name,
            p.description,
            p.category,
            p.price,
            p.image_url,
            p.url_slug,
            p.details,
            p.metadata,
            COALESCE(COUNT(CASE WHEN v.vote_type = 'up' THEN 1 END), 0) as upvotes,
            COALESCE(COUNT(CASE WHEN v.vote_type = 'down' THEN 1 END), 0) as downvotes,
            COALESCE(COUNT(CASE WHEN v.vote_type = 'neutral' THEN 1 END), 0) as neutral_votes,
            MAX(v.created_at) as last_vote
        FROM products p
        LEFT JOIN votes v ON p.id = v.product_id
        GROUP BY p.id, p.name, p.description, p.category, p.price, p.image_url, p.url_slug, p.details, p.metadata
    )
    SELECT 
        *,
        COALESCE(upvotes - downvotes, 0) as score,
        CASE 
            WHEN (upvotes + downvotes) = 0 THEN 0
            ELSE (upvotes::float / (upvotes + downvotes))::numeric(5,4)
        END as controversy_score,
        RANK() OVER (ORDER BY (upvotes - downvotes) DESC) as rank
    FROM vote_counts;

    -- Create function to refresh rankings
    CREATE OR REPLACE FUNCTION refresh_product_rankings()
    RETURNS TRIGGER AS $$
    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for rankings refresh
    DROP TRIGGER IF EXISTS refresh_rankings_on_vote ON votes;
    CREATE TRIGGER refresh_rankings_on_vote
        AFTER INSERT OR UPDATE OR DELETE ON votes
        FOR EACH STATEMENT
        EXECUTE FUNCTION refresh_product_rankings();

    -- Insert sample products for each category (5 per category)
    FOR v_category IN 
        SELECT id FROM categories
    LOOP
        -- Gaming Mice
        IF v_category = 'gaming-mice' THEN
            INSERT INTO products (name, description, category, price, url_slug, image_url, details, metadata)
            VALUES 
                (
                    'Logitech G Pro X Superlight',
                    'Ultra-lightweight wireless gaming mouse for professional esports',
                    'gaming-mice',
                    149.99,
                    'logitech-g-pro-x-superlight',
                    'https://example.com/gpro.jpg',
                    jsonb_build_object(
                        'dpi', '25600',
                        'weight', '63g',
                        'battery_life', '70 hours',
                        'connection', 'Wireless',
                        'sensor', 'HERO 25K'
                    ),
                    jsonb_build_object(
                        'pros', array['Ultra-lightweight', 'Excellent sensor', 'Long battery life'],
                        'cons', array['Expensive', 'No RGB']
                    )
                ),
                (
                    'Razer Viper V2 Pro',
                    'Professional-grade wireless gaming mouse',
                    'gaming-mice',
                    149.99,
                    'razer-viper-v2-pro',
                    'https://example.com/viper.jpg',
                    jsonb_build_object(
                        'dpi', '30000',
                        'weight', '58g',
                        'battery_life', '80 hours',
                        'connection', 'Wireless',
                        'sensor', 'Focus Pro 30K'
                    ),
                    jsonb_build_object(
                        'pros', array['Very lightweight', 'Top sensor', 'Ambidextrous'],
                        'cons', array['Expensive', 'Limited buttons']
                    )
                )
            ON CONFLICT (url_slug) DO NOTHING;
        END IF;

        -- Gaming Keyboards
        IF v_category = 'gaming-keyboards' THEN
            INSERT INTO products (name, description, category, price, url_slug, image_url, details, metadata)
            VALUES 
                (
                    'Wooting 60HE',
                    'Revolutionary analog mechanical keyboard',
                    'gaming-keyboards',
                    199.99,
                    'wooting-60he',
                    'https://example.com/wooting.jpg',
                    jsonb_build_object(
                        'switches', 'Lekker (Hall Effect)',
                        'layout', '60%',
                        'connection', 'USB-C',
                        'features', 'Analog input'
                    ),
                    jsonb_build_object(
                        'pros', array['Analog input', 'Rapid trigger', 'Premium build'],
                        'cons', array['Learning curve', 'Premium price']
                    )
                ),
                (
                    'Keychron Q1',
                    'Premium gasket-mounted mechanical keyboard',
                    'gaming-keyboards',
                    169.99,
                    'keychron-q1',
                    'https://example.com/keychron.jpg',
                    jsonb_build_object(
                        'switches', 'Gateron',
                        'layout', '75%',
                        'connection', 'USB-C',
                        'features', 'Hot-swappable'
                    ),
                    jsonb_build_object(
                        'pros', array['Premium build', 'Customizable', 'Great typing experience'],
                        'cons', array['Heavy', 'No wireless']
                    )
                )
            ON CONFLICT (url_slug) DO NOTHING;
        END IF;

        -- Add error handling
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
            PERFORM log_error(
                v_error_message,
                jsonb_build_object(
                    'category', v_category,
                    'context', 'Product insertion'
                )
            );
    END LOOP;

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
    CREATE INDEX IF NOT EXISTS idx_products_url_slug ON products(url_slug);
    CREATE INDEX IF NOT EXISTS idx_votes_product_user ON votes(product_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_product_rankings_id ON product_rankings (id);

    -- Enable Row Level Security
    ALTER TABLE products ENABLE ROW LEVEL SECURITY;
    ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
    ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    -- Products: everyone can view, only admins can modify
    CREATE POLICY "Enable read access for all users" ON products
        FOR SELECT USING (true);

    -- Votes: authenticated users can vote
    CREATE POLICY "Enable authenticated users to vote" ON votes
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    -- Reviews: authenticated users can review
    CREATE POLICY "Enable authenticated users to review" ON reviews
        FOR ALL TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

    -- Grant appropriate permissions
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT INSERT, UPDATE, DELETE ON votes TO authenticated;
    GRANT INSERT, UPDATE, DELETE ON reviews TO authenticated;

    -- Create function to update vote counts
    CREATE OR REPLACE FUNCTION update_vote_counts()
    RETURNS TRIGGER AS $$
    BEGIN
        IF TG_OP = 'INSERT' THEN
            UPDATE products
            SET 
                upvotes = upvotes + CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE 0 END,
                downvotes = downvotes + CASE WHEN NEW.vote_type = 'down' THEN 1 ELSE 0 END,
                last_vote_timestamp = now()
            WHERE id = NEW.product_id;
        ELSIF TG_OP = 'UPDATE' THEN
            UPDATE products
            SET 
                upvotes = upvotes + CASE WHEN NEW.vote_type = 'up' THEN 1 ELSE 0 END - CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE 0 END,
                downvotes = downvotes + CASE WHEN NEW.vote_type = 'down' THEN 1 ELSE 0 END - CASE WHEN OLD.vote_type = 'down' THEN 1 ELSE 0 END,
                last_vote_timestamp = now()
            WHERE id = NEW.product_id;
        ELSIF TG_OP = 'DELETE' THEN
            UPDATE products
            SET 
                upvotes = upvotes - CASE WHEN OLD.vote_type = 'up' THEN 1 ELSE 0 END,
                downvotes = downvotes - CASE WHEN OLD.vote_type = 'down' THEN 1 ELSE 0 END,
                last_vote_timestamp = now()
            WHERE id = OLD.product_id;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for vote counts
    DROP TRIGGER IF EXISTS update_vote_counts_trigger ON votes;
    CREATE TRIGGER update_vote_counts_trigger
        AFTER INSERT OR UPDATE OR DELETE ON votes
        FOR EACH ROW
        EXECUTE FUNCTION update_vote_counts();

    -- Refresh the materialized view
    REFRESH MATERIALIZED VIEW product_rankings;

EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_error_message = MESSAGE_TEXT;
    PERFORM log_error(
        v_error_message,
        jsonb_build_object(
            'context', 'Full backend setup',
            'timestamp', now()
        )
    );
    RAISE EXCEPTION 'Backend setup failed: %', v_error_message;
END $$; 
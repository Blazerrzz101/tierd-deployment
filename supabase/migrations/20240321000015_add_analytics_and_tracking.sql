-- Create analytics tables for user tracking
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id),
    event_type TEXT NOT NULL,
    event_data JSONB,
    page_url TEXT,
    user_agent TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product interaction tracking
CREATE TABLE IF NOT EXISTS product_interactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    interaction_type TEXT NOT NULL,
    interaction_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id),
    theme TEXT DEFAULT 'system',
    email_notifications BOOLEAN DEFAULT true,
    notification_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to track product views
CREATE OR REPLACE FUNCTION track_product_view(
    product_id UUID,
    user_id UUID,
    view_data JSONB DEFAULT '{}'
)
RETURNS void AS $$
BEGIN
    INSERT INTO product_interactions (
        product_id,
        user_id,
        interaction_type,
        interaction_data
    ) VALUES (
        product_id,
        user_id,
        'view',
        view_data
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to track user events
CREATE OR REPLACE FUNCTION track_user_event(
    p_user_id UUID,
    p_event_type TEXT,
    p_event_data JSONB DEFAULT '{}',
    p_page_url TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO user_analytics (
        user_id,
        event_type,
        event_data,
        page_url,
        user_agent,
        ip_address
    ) VALUES (
        p_user_id,
        p_event_type,
        p_event_data,
        p_page_url,
        p_user_agent,
        p_ip_address
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for user_analytics
CREATE POLICY "Users can view their own analytics"
    ON user_analytics FOR SELECT
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Service role can insert analytics"
    ON user_analytics FOR INSERT
    WITH CHECK (true);

-- Policies for product_interactions
CREATE POLICY "Users can view their own interactions"
    ON product_interactions FOR SELECT
    USING (auth.uid()::uuid = user_id);

CREATE POLICY "Service role can insert interactions"
    ON product_interactions FOR INSERT
    WITH CHECK (true);

-- Policies for user_preferences
CREATE POLICY "Users can manage their own preferences"
    ON user_preferences FOR ALL
    USING (auth.uid()::uuid = user_id)
    WITH CHECK (auth.uid()::uuid = user_id);

-- Create indexes for performance
CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX idx_product_interactions_product_id ON product_interactions(product_id);
CREATE INDEX idx_product_interactions_user_id ON product_interactions(user_id); 
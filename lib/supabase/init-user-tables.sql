-- Initialize required user-related tables for Tier'd application

-- Users table to store user profile information
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User preferences table for storing settings and preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_settings JSONB DEFAULT '{"emailNotifications": true, "darkMode": false}'::jsonb,
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can read their own data and public profiles
CREATE POLICY "Users can read their own profile"
    ON users FOR SELECT
    USING (auth.uid() = id OR is_public = true);

-- RLS policy: Users can update only their own profile
CREATE POLICY "Users can update their own profile"
    ON users FOR UPDATE
    USING (auth.uid() = id);

-- RLS policy: Only self can read preferences
CREATE POLICY "Users can read their own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- RLS policy: Only self can update preferences
CREATE POLICY "Users can update their own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- Create a trigger to automatically create user profile on auth signup
CREATE OR REPLACE FUNCTION create_profile_for_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_profile_for_user();

-- Create RPC function to update user profile and preferences in one call
CREATE OR REPLACE FUNCTION update_user_profile(
    p_username TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_is_public BOOLEAN DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_notification_settings JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Get authenticated user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Update user profile
    UPDATE users
    SET 
        username = COALESCE(p_username, username),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        is_public = COALESCE(p_is_public, is_public),
        updated_at = now()
    WHERE id = v_user_id;
    
    -- Insert or update user preferences
    INSERT INTO user_preferences (user_id, bio, notification_settings)
    VALUES (
        v_user_id,
        p_bio,
        p_notification_settings
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        bio = COALESCE(p_bio, user_preferences.bio),
        notification_settings = CASE
            WHEN p_notification_settings IS NULL THEN user_preferences.notification_settings
            ELSE p_notification_settings
        END,
        updated_at = now();
    
    -- Return updated data
    SELECT jsonb_build_object(
        'success', true,
        'user', jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'avatar_url', u.avatar_url,
            'is_public', u.is_public
        ),
        'preferences', jsonb_build_object(
            'bio', up.bio,
            'notification_settings', up.notification_settings
        )
    )
    INTO v_result
    FROM users u
    LEFT JOIN user_preferences up ON u.id = up.user_id
    WHERE u.id = v_user_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get user profile with preferences
CREATE OR REPLACE FUNCTION get_user_profile(
    p_user_id UUID DEFAULT NULL -- If null, get current user's profile
) RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_result JSONB;
BEGIN
    -- Get target user ID
    v_user_id := COALESCE(p_user_id, auth.uid());
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID required';
    END IF;

    -- Check access permissions
    IF p_user_id IS NOT NULL AND p_user_id != auth.uid() THEN
        -- Viewing another user, check if profile is public
        IF NOT EXISTS (SELECT 1 FROM users WHERE id = p_user_id AND is_public = true) THEN
            RAISE EXCEPTION 'Profile is not public';
        END IF;
    END IF;

    -- Get profile data
    SELECT jsonb_build_object(
        'user', jsonb_build_object(
            'id', u.id,
            'username', u.username,
            'avatar_url', u.avatar_url,
            'is_public', u.is_public,
            'created_at', u.created_at
        ),
        'preferences', CASE
            WHEN p_user_id IS NULL OR p_user_id = auth.uid() THEN
                jsonb_build_object(
                    'bio', up.bio,
                    'notification_settings', up.notification_settings
                )
            ELSE
                jsonb_build_object(
                    'bio', up.bio
                )
            END
    )
    INTO v_result
    FROM users u
    LEFT JOIN user_preferences up ON u.id = up.user_id
    WHERE u.id = v_user_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 
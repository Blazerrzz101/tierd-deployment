-- Function to check if a user is authenticated and active
CREATE OR REPLACE FUNCTION public.is_user_active(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    last_activity TIMESTAMPTZ;
BEGIN
    SELECT last_seen INTO last_activity
    FROM public.user_profiles
    WHERE id = user_id;

    RETURN last_activity IS NOT NULL 
        AND last_activity > NOW() - INTERVAL '30 days';
END;
$$;

-- Function to get user's authentication status
CREATE OR REPLACE FUNCTION public.get_auth_status()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
    result JSONB;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'message', 'Not authenticated'
        );
    END IF;

    SELECT jsonb_build_object(
        'authenticated', true,
        'user_id', p.id,
        'username', p.username,
        'email', p.email,
        'avatar_url', p.avatar_url,
        'is_active', public.is_user_active(p.id),
        'last_seen', p.last_seen,
        'preferences', p.preferences
    ) INTO result
    FROM public.user_profiles p
    WHERE p.id = current_user_id;

    RETURN result;
END;
$$;

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
    activity_type TEXT,
    activity_data JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated to log activity';
    END IF;

    -- Update last_seen
    UPDATE public.user_profiles
    SET last_seen = NOW()
    WHERE id = current_user_id;

    -- Could extend this to store activities in a separate table if needed
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.is_user_active TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_status TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen 
ON public.user_profiles(last_seen DESC);

-- Add function to handle user deletion
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER AS $$
BEGIN
    -- Clean up user data
    -- This is where you would add cleanup for other tables
    -- that might contain user data
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for user deletion
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
    BEFORE DELETE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_deletion(); 
-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_user_profiles(UUID[]);

-- Create function to get user profiles
CREATE OR REPLACE FUNCTION get_user_profiles(user_ids UUID[])
RETURNS TABLE (
    id UUID,
    email VARCHAR,
    username VARCHAR,
    avatar_url VARCHAR,
    raw_user_meta_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email::VARCHAR,
        (u.raw_user_meta_data->>'username')::VARCHAR as username,
        (u.raw_user_meta_data->>'avatar_url')::VARCHAR as avatar_url,
        u.raw_user_meta_data
    FROM auth.users u
    WHERE u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_profiles(UUID[]) TO authenticated; 
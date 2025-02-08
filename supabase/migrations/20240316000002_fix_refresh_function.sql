-- Drop existing objects
DROP TRIGGER IF EXISTS refresh_rankings_on_vote ON product_votes;
DROP TRIGGER IF EXISTS refresh_rankings_on_review ON reviews;
DROP FUNCTION IF EXISTS refresh_product_rankings();

-- Create a new function to handle ranking updates
CREATE OR REPLACE FUNCTION handle_ranking_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    -- Update the materialized view
    REFRESH MATERIALIZED VIEW product_rankings;
    RETURN NULL;
END;
$$;

-- Create triggers that use the new function
CREATE TRIGGER update_rankings_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON product_votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION handle_ranking_update();

CREATE TRIGGER update_rankings_on_review
    AFTER INSERT OR UPDATE OR DELETE ON reviews
    FOR EACH STATEMENT
    EXECUTE FUNCTION handle_ranking_update();

-- Grant necessary permissions
ALTER MATERIALIZED VIEW product_rankings OWNER TO postgres;
GRANT SELECT ON product_rankings TO anon, authenticated;
GRANT ALL ON product_rankings TO postgres;

-- Create function to get user profiles
CREATE OR REPLACE FUNCTION get_user_profiles(user_ids UUID[])
RETURNS TABLE (
  id UUID,
  email TEXT,
  username TEXT,
  avatar_url TEXT,
  raw_user_meta_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.raw_user_meta_data->>'username' as username,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    u.raw_user_meta_data
  FROM auth.users u
  WHERE u.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER; 
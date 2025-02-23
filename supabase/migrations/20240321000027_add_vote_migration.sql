-- Create function to migrate anonymous votes
CREATE OR REPLACE FUNCTION migrate_anonymous_votes(
    p_user_id uuid,
    p_client_id text
) RETURNS void AS $$
BEGIN
    -- Update anonymous votes to be associated with the user
    UPDATE votes
    SET user_id = p_user_id,
        metadata = '{}'::jsonb
    WHERE user_id IS NULL
    AND metadata->>'client_id' = p_client_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION migrate_anonymous_votes(uuid, text) TO authenticated; 
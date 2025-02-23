-- Create function to migrate anonymous votes
CREATE OR REPLACE FUNCTION migrate_anonymous_votes()
RETURNS TRIGGER AS $$
DECLARE
    v_client_id text;
BEGIN
    -- Get client_id from user metadata if it exists
    v_client_id := NEW.raw_user_meta_data->>'vote_client_id';
    
    -- Only proceed if we have a client_id
    IF v_client_id IS NOT NULL THEN
        -- Update anonymous votes to be associated with the new user
        UPDATE votes
        SET 
            user_id = NEW.id,
            metadata = metadata - 'client_id'
        WHERE 
            metadata->>'client_id' = v_client_id
            AND user_id IS NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created_migrate_votes ON auth.users;
CREATE TRIGGER on_auth_user_created_migrate_votes
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION migrate_anonymous_votes();

-- Update vote_for_product function to handle vote migration
CREATE OR REPLACE FUNCTION vote_for_product(
    p_product_id uuid,
    p_vote_type integer,
    p_client_id text DEFAULT NULL
)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id uuid;
    v_existing_vote integer;
    v_result jsonb;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Handle authenticated users
    IF v_user_id IS NOT NULL THEN
        -- Check for existing vote
        SELECT vote_type INTO v_existing_vote
        FROM votes
        WHERE product_id = p_product_id
        AND user_id = v_user_id;
        
        -- Also check for anonymous votes to migrate
        IF v_existing_vote IS NULL AND p_client_id IS NOT NULL THEN
            UPDATE votes
            SET 
                user_id = v_user_id,
                metadata = metadata - 'client_id'
            WHERE 
                product_id = p_product_id
                AND metadata->>'client_id' = p_client_id
                AND user_id IS NULL
            RETURNING vote_type INTO v_existing_vote;
        END IF;
        
        IF v_existing_vote IS NULL THEN
            -- Insert new vote
            INSERT INTO votes (product_id, user_id, vote_type)
            VALUES (p_product_id, v_user_id, p_vote_type);
            
            v_result := jsonb_build_object(
                'success', true,
                'vote_type', p_vote_type,
                'action', 'inserted'
            );
        ELSIF v_existing_vote = p_vote_type THEN
            -- Remove vote if same type
            DELETE FROM votes
            WHERE product_id = p_product_id
            AND user_id = v_user_id;
            
            v_result := jsonb_build_object(
                'success', true,
                'vote_type', null,
                'action', 'removed'
            );
        ELSE
            -- Update vote type
            UPDATE votes
            SET vote_type = p_vote_type
            WHERE product_id = p_product_id
            AND user_id = v_user_id;
            
            v_result := jsonb_build_object(
                'success', true,
                'vote_type', p_vote_type,
                'action', 'updated'
            );
        END IF;
    ELSE
        -- Handle anonymous voting
        IF p_client_id IS NULL THEN
            RAISE EXCEPTION 'Client ID is required for anonymous voting';
        END IF;
        
        -- Check rate limit
        IF (
            SELECT COUNT(*)
            FROM votes
            WHERE metadata->>'client_id' = p_client_id
            AND user_id IS NULL
        ) >= 5 THEN
            RAISE EXCEPTION 'Anonymous vote limit reached. Please sign in to continue voting.';
        END IF;
        
        -- Check for existing anonymous vote
        SELECT vote_type INTO v_existing_vote
        FROM votes
        WHERE product_id = p_product_id
        AND metadata->>'client_id' = p_client_id
        AND user_id IS NULL;
        
        IF v_existing_vote IS NULL THEN
            -- Insert new vote
            INSERT INTO votes (product_id, vote_type, metadata)
            VALUES (
                p_product_id,
                p_vote_type,
                jsonb_build_object('client_id', p_client_id)
            );
            
            v_result := jsonb_build_object(
                'success', true,
                'vote_type', p_vote_type,
                'action', 'inserted'
            );
        ELSIF v_existing_vote = p_vote_type THEN
            -- Remove vote if same type
            DELETE FROM votes
            WHERE product_id = p_product_id
            AND metadata->>'client_id' = p_client_id
            AND user_id IS NULL;
            
            v_result := jsonb_build_object(
                'success', true,
                'vote_type', null,
                'action', 'removed'
            );
        ELSE
            -- Update vote type
            UPDATE votes
            SET vote_type = p_vote_type
            WHERE product_id = p_product_id
            AND metadata->>'client_id' = p_client_id
            AND user_id IS NULL;
            
            v_result := jsonb_build_object(
                'success', true,
                'vote_type', p_vote_type,
                'action', 'updated'
            );
        END IF;
    END IF;
    
    -- Refresh materialized views
    PERFORM refresh_product_rankings();
    
    RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION vote_for_product(uuid, integer, text) TO authenticated, anon; 
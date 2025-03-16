-- Drop existing function
DROP FUNCTION IF EXISTS vote_for_product(uuid, integer);

-- Create the function with proper vote type handling
CREATE OR REPLACE FUNCTION vote_for_product(
  p_product_id uuid,
  p_vote_type integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_existing_vote integer;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  -- Check if user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to vote';
  END IF;

  -- Get existing vote
  SELECT vote_type INTO v_existing_vote
  FROM votes
  WHERE product_id = p_product_id AND user_id = v_user_id;

  -- Handle vote
  IF v_existing_vote IS NULL THEN
    -- Insert new vote
    INSERT INTO votes (product_id, user_id, vote_type)
    VALUES (p_product_id, v_user_id, p_vote_type);
  ELSIF v_existing_vote = p_vote_type THEN
    -- Remove vote if clicking same button
    DELETE FROM votes
    WHERE product_id = p_product_id AND user_id = v_user_id;
  ELSE
    -- Update vote if changing vote type
    UPDATE votes
    SET vote_type = p_vote_type,
        updated_at = NOW()
    WHERE product_id = p_product_id AND user_id = v_user_id;
  END IF;

  -- Refresh materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
  REFRESH MATERIALIZED VIEW CONCURRENTLY category_stats;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION vote_for_product(uuid, integer) TO authenticated; 
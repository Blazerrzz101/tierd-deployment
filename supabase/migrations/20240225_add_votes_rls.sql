-- Enable RLS on votes table
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Grant access to the votes table for the anon and authenticated roles
GRANT SELECT, INSERT, UPDATE, DELETE ON votes TO anon, authenticated;

-- Create policy for selecting votes (anyone can read votes)
CREATE POLICY "Anyone can read votes" 
ON votes FOR SELECT 
USING (true);

-- Create policy for inserting votes (anyone can insert votes)
CREATE POLICY "Anyone can insert votes" 
ON votes FOR INSERT 
WITH CHECK (true);

-- Create policy for updating votes (users can only update their own votes)
CREATE POLICY "Users can update their own votes" 
ON votes FOR UPDATE 
USING (metadata->>'client_id' = current_setting('request.jwt.claims', true)::json->>'client_id' OR 
       metadata->>'client_id' = current_setting('request.headers', true)::json->>'x-client-id');

-- Create policy for deleting votes (users can only delete their own votes)
CREATE POLICY "Users can delete their own votes" 
ON votes FOR DELETE 
USING (metadata->>'client_id' = current_setting('request.jwt.claims', true)::json->>'client_id' OR 
       metadata->>'client_id' = current_setting('request.headers', true)::json->>'x-client-id');

-- Create function to check if a user has voted for a product
CREATE OR REPLACE FUNCTION has_user_voted(p_client_id TEXT, p_product_id UUID)
RETURNS TABLE (has_voted BOOLEAN, vote_type INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    CASE WHEN v.id IS NOT NULL THEN TRUE ELSE FALSE END as has_voted,
    v.vote_type
  FROM votes v
  WHERE v.product_id = p_product_id
    AND v.metadata->>'client_id' = p_client_id
  LIMIT 1;
END;
$$;

-- Create function to vote for a product
CREATE OR REPLACE FUNCTION vote_for_product(p_product_id UUID, p_vote_type INTEGER, p_client_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_vote_id UUID;
  v_existing_vote_type INTEGER;
  v_result JSONB;
BEGIN
  -- Check if user has already voted
  SELECT id, vote_type INTO v_existing_vote_id, v_existing_vote_type
  FROM votes
  WHERE product_id = p_product_id
    AND metadata->>'client_id' = p_client_id
  LIMIT 1;
  
  -- Handle the vote
  IF v_existing_vote_id IS NOT NULL THEN
    -- User has already voted
    IF v_existing_vote_type = p_vote_type THEN
      -- Remove vote if same type (toggle off)
      DELETE FROM votes WHERE id = v_existing_vote_id;
      v_result = jsonb_build_object('success', true, 'vote_type', NULL);
    ELSE
      -- Update vote if different type
      UPDATE votes 
      SET vote_type = p_vote_type, 
          updated_at = NOW()
      WHERE id = v_existing_vote_id;
      v_result = jsonb_build_object('success', true, 'vote_type', p_vote_type);
    END IF;
  ELSE
    -- Create new vote
    INSERT INTO votes (product_id, vote_type, metadata)
    VALUES (p_product_id, p_vote_type, jsonb_build_object('client_id', p_client_id));
    v_result = jsonb_build_object('success', true, 'vote_type', p_vote_type);
  END IF;
  
  RETURN v_result;
END;
$$; 
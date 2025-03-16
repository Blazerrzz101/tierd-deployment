-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create votes table with proper constraints
CREATE TABLE IF NOT EXISTS votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  vote_type SMALLINT CHECK (vote_type IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  client_id TEXT,
  UNIQUE(product_id, COALESCE(user_id, client_id))
);

-- Create function to handle vote upserts with rate limiting
CREATE OR REPLACE FUNCTION handle_vote(
  p_product_id UUID,
  p_vote_type SMALLINT,
  p_client_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_vote_count INT;
  v_result JSONB;
BEGIN
  -- Get authenticated user if available
  v_user_id := auth.uid();
  
  -- Check rate limit for anonymous users
  IF v_user_id IS NULL THEN
    SELECT COUNT(*)
    INTO v_vote_count
    FROM votes
    WHERE client_id = p_client_id
    AND created_at > now() - interval '1 hour'
    AND deleted_at IS NULL;
    
    IF v_vote_count >= 5 THEN
      RAISE EXCEPTION 'Rate limit exceeded for anonymous voting';
    END IF;
  END IF;

  -- Upsert vote with atomic transaction
  INSERT INTO votes (product_id, user_id, vote_type, client_id, metadata)
  VALUES (
    p_product_id,
    v_user_id,
    p_vote_type,
    CASE WHEN v_user_id IS NULL THEN p_client_id ELSE NULL END,
    jsonb_build_object(
      'client_id', p_client_id,
      'ip_address', current_setting('request.headers')::jsonb->>'x-forwarded-for',
      'user_agent', current_setting('request.headers')::jsonb->>'user-agent'
    )
  )
  ON CONFLICT (product_id, COALESCE(user_id, client_id))
  DO UPDATE SET
    vote_type = CASE
      WHEN votes.vote_type = EXCLUDED.vote_type THEN NULL -- Toggle off if same vote
      ELSE EXCLUDED.vote_type -- Change vote otherwise
    END,
    updated_at = now(),
    deleted_at = CASE
      WHEN votes.vote_type = EXCLUDED.vote_type THEN now() -- Soft delete if toggled off
      ELSE NULL
    END;

  -- Return updated vote counts
  SELECT jsonb_build_object(
    'upvotes', COUNT(*) FILTER (WHERE vote_type = 1),
    'downvotes', COUNT(*) FILTER (WHERE vote_type = -1),
    'score', COUNT(*) FILTER (WHERE vote_type = 1) - COUNT(*) FILTER (WHERE vote_type = -1)
  )
  INTO v_result
  FROM votes
  WHERE product_id = p_product_id
  AND deleted_at IS NULL;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
CREATE POLICY "Enable read access for all users"
  ON votes FOR SELECT
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON votes FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL OR
    (
      auth.uid() IS NULL AND
      (
        SELECT COUNT(*)
        FROM votes
        WHERE client_id = NEW.client_id
        AND created_at > now() - interval '1 hour'
        AND deleted_at IS NULL
      ) < 5
    )
  );

CREATE POLICY "Enable update for vote owners"
  ON votes FOR UPDATE
  USING (
    auth.uid() = user_id OR
    (auth.uid() IS NULL AND client_id = current_setting('request.jwt.claims')::jsonb->>'client_id')
  );

-- Create realtime publication for vote changes
DROP PUBLICATION IF EXISTS votes_changes;
CREATE PUBLICATION votes_changes FOR TABLE votes;

-- Create function to merge anonymous votes on user authentication
CREATE OR REPLACE FUNCTION merge_anonymous_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- Update anonymous votes with the user's ID
  UPDATE votes
  SET user_id = NEW.id,
      client_id = NULL,
      updated_at = now()
  WHERE client_id IN (
    SELECT value->>'client_id'
    FROM auth.users,
      jsonb_array_elements(raw_app_meta_data) AS value
    WHERE id = NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to merge votes on user authentication
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION merge_anonymous_votes(); 
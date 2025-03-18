-- Direct SQL migration script to run directly in Supabase SQL Editor
-- This fixes the parameter order issue that's causing the errors

-- 1. Create votes table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'votes'
  ) THEN
    CREATE TABLE public.votes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      product_id UUID NOT NULL,
      user_id UUID,
      vote_type INTEGER NOT NULL,
      metadata JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
    
    -- Add RLS policies
    ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
    
    -- Add indices for performance
    CREATE INDEX idx_votes_product_id ON public.votes(product_id);
    CREATE INDEX idx_votes_user_id ON public.votes(user_id) WHERE user_id IS NOT NULL;
    CREATE INDEX idx_votes_client_id ON public.votes((metadata->>'client_id')) WHERE metadata->>'client_id' IS NOT NULL;
  END IF;
END
$$;

-- 2. Function to check if a user has already voted
-- Create with BOTH parameter orders to handle all cases
CREATE OR REPLACE FUNCTION public.has_user_voted(
  p_product_id UUID,
  p_client_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vote_id UUID;
  v_vote_type INTEGER;
  v_upvotes INTEGER;
  v_downvotes INTEGER;
BEGIN
  -- Check if this client has already voted
  SELECT id, vote_type INTO v_vote_id, v_vote_type
  FROM votes
  WHERE 
    product_id = p_product_id
    AND metadata->>'client_id' = p_client_id
  LIMIT 1;
  
  -- Count all votes for this product
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 1) AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = -1) AS downvotes
  INTO v_upvotes, v_downvotes
  FROM votes
  WHERE product_id = p_product_id;
  
  -- Return the result
  RETURN jsonb_build_object(
    'hasVoted', v_vote_id IS NOT NULL,
    'voteType', v_vote_type,
    'upvotes', v_upvotes,
    'downvotes', v_downvotes,
    'score', v_upvotes - v_downvotes
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'hasVoted', false,
      'voteType', null,
      'upvotes', 0,
      'downvotes', 0,
      'score', 0,
      'error', SQLERRM
    );
END;
$$;

-- 3. Create a version with the parameters in the order expected by the application
-- This is the key fix - parameter order matters!
CREATE OR REPLACE FUNCTION public.vote_for_product(
  p_client_id TEXT,
  p_product_id UUID,
  p_user_id UUID,
  p_vote_type INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_vote_id UUID;
  v_existing_vote_type INTEGER;
  v_upvotes INTEGER;
  v_downvotes INTEGER;
BEGIN
  -- Check if this client has already voted
  SELECT id, vote_type INTO v_existing_vote_id, v_existing_vote_type
  FROM votes
  WHERE 
    product_id = p_product_id
    AND metadata->>'client_id' = p_client_id
  LIMIT 1;
  
  -- Handle the vote
  IF v_existing_vote_id IS NULL THEN
    -- New vote
    INSERT INTO votes (
      product_id, 
      user_id, 
      vote_type, 
      metadata
    ) VALUES (
      p_product_id, 
      p_user_id, 
      p_vote_type, 
      jsonb_build_object(
        'client_id', p_client_id,
        'ip', NULL,
        'user_agent', NULL
      )
    );
  ELSIF v_existing_vote_type = p_vote_type THEN
    -- Remove vote if clicking the same button
    DELETE FROM votes WHERE id = v_existing_vote_id;
    -- Set to null to indicate vote was removed
    p_vote_type := NULL;
  ELSE
    -- Change vote
    UPDATE votes 
    SET 
      vote_type = p_vote_type,
      updated_at = now() 
    WHERE id = v_existing_vote_id;
  END IF;
  
  -- Count all votes for this product
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 1) AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = -1) AS downvotes
  INTO v_upvotes, v_downvotes
  FROM votes
  WHERE product_id = p_product_id;
  
  -- Return the result
  RETURN jsonb_build_object(
    'hasVoted', p_vote_type IS NOT NULL,
    'voteType', p_vote_type,
    'upvotes', v_upvotes,
    'downvotes', v_downvotes,
    'score', v_upvotes - v_downvotes
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'hasVoted', false,
      'voteType', NULL,
      'upvotes', 0,
      'downvotes', 0,
      'score', 0,
      'error', SQLERRM
    );
END;
$$;

-- 4. Also keep our original parameter order for completeness
CREATE OR REPLACE FUNCTION public.vote_for_product(
  p_product_id UUID,
  p_vote_type INTEGER,
  p_client_id TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_vote_id UUID;
  v_existing_vote_type INTEGER;
  v_upvotes INTEGER;
  v_downvotes INTEGER;
BEGIN
  -- Check if this client has already voted
  SELECT id, vote_type INTO v_existing_vote_id, v_existing_vote_type
  FROM votes
  WHERE 
    product_id = p_product_id
    AND metadata->>'client_id' = p_client_id
  LIMIT 1;
  
  -- Handle the vote
  IF v_existing_vote_id IS NULL THEN
    -- New vote
    INSERT INTO votes (
      product_id, 
      user_id, 
      vote_type, 
      metadata
    ) VALUES (
      p_product_id, 
      p_user_id, 
      p_vote_type, 
      jsonb_build_object(
        'client_id', p_client_id,
        'ip', NULL,
        'user_agent', NULL
      )
    );
  ELSIF v_existing_vote_type = p_vote_type THEN
    -- Remove vote if clicking the same button
    DELETE FROM votes WHERE id = v_existing_vote_id;
    -- Set to null to indicate vote was removed
    p_vote_type := NULL;
  ELSE
    -- Change vote
    UPDATE votes 
    SET 
      vote_type = p_vote_type,
      updated_at = now() 
    WHERE id = v_existing_vote_id;
  END IF;
  
  -- Count all votes for this product
  SELECT 
    COUNT(*) FILTER (WHERE vote_type = 1) AS upvotes,
    COUNT(*) FILTER (WHERE vote_type = -1) AS downvotes
  INTO v_upvotes, v_downvotes
  FROM votes
  WHERE product_id = p_product_id;
  
  -- Return the result
  RETURN jsonb_build_object(
    'hasVoted', p_vote_type IS NOT NULL,
    'voteType', p_vote_type,
    'upvotes', v_upvotes,
    'downvotes', v_downvotes,
    'score', v_upvotes - v_downvotes
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'hasVoted', false,
      'voteType', NULL,
      'upvotes', 0,
      'downvotes', 0,
      'score', 0,
      'error', SQLERRM
    );
END;
$$;

-- 5. Function to check remaining votes
CREATE OR REPLACE FUNCTION public.get_remaining_client_votes(
    p_client_id text,
    p_max_votes integer DEFAULT 5
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_total_votes integer;
    v_remaining_votes integer;
BEGIN
    -- Count votes by this client in the last 24 hours
    SELECT COUNT(*)
    INTO v_total_votes
    FROM votes
    WHERE 
        metadata->>'client_id' = p_client_id
        AND user_id IS NULL
        AND created_at > (NOW() - INTERVAL '24 hours');
    
    -- Calculate remaining votes
    v_remaining_votes := GREATEST(0, p_max_votes - v_total_votes);
    
    -- Return the result
    RETURN jsonb_build_object(
        'remaining_votes', v_remaining_votes,
        'total_votes', v_total_votes,
        'max_votes', p_max_votes
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'remaining_votes', 0,
            'total_votes', 0,
            'max_votes', p_max_votes,
            'error', SQLERRM
        );
END;
$$;

-- Grant permissions to all functions
GRANT EXECUTE ON FUNCTION public.has_user_voted(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vote_for_product(TEXT, UUID, UUID, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.vote_for_product(UUID, INTEGER, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_remaining_client_votes(TEXT, INTEGER) TO anon, authenticated, service_role;

-- Create RLS policy that allows anyone to select from the votes table
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access for all users" ON public.votes;
CREATE POLICY "Allow read access for all users" ON public.votes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow insert/update for authenticated users" ON public.votes;
CREATE POLICY "Allow insert/update for authenticated users" ON public.votes FOR ALL USING (true) WITH CHECK (true);

-- Make the votes table accessible to all roles
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.votes TO anon, authenticated, service_role;

-- Success message
SELECT 'Vote system migration completed successfully'; 
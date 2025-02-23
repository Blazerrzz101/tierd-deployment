-- Drop triggers first
DROP TRIGGER IF EXISTS refresh_rankings_vote ON votes;
DROP TRIGGER IF EXISTS refresh_rankings_review ON reviews;

-- Drop policies that depend on functions
ALTER TABLE votes DROP POLICY IF EXISTS "Anonymous users can vote with rate limiting";

-- Now we can safely drop the functions
DROP FUNCTION IF EXISTS refresh_product_rankings() CASCADE;
DROP FUNCTION IF EXISTS handle_anonymous_vote(UUID, TEXT, TEXT) CASCADE;

-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Create improved materialized view with better ranking algorithm
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_stats AS (
  SELECT 
    p.id,
    COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 'upvote'), 0) as upvotes,
    COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type = 'downvote'), 0) as downvotes,
    COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) as rating,
    COUNT(DISTINCT r.id) as review_count,
    GREATEST(1, EXTRACT(EPOCH FROM (now() - p.created_at))/3600) as hours_since_created
  FROM products p
  LEFT JOIN votes v ON p.id = v.product_id
  LEFT JOIN reviews r ON p.id = r.product_id
  GROUP BY p.id
),
scores AS (
  SELECT 
    p.*,
    vs.upvotes,
    vs.downvotes,
    vs.rating,
    vs.review_count,
    vs.upvotes + vs.downvotes as total_votes,
    -- Modified Wilson score to handle edge cases
    CASE WHEN vs.review_count > 0 THEN
      LEAST(5, GREATEST(0, 
        ((vs.rating * vs.review_count + 1.9208) / (vs.review_count + 3.8416) -
        1.96 * SQRT(((vs.rating * (1 - vs.rating/5)) + 0.9604) / (vs.review_count + 3.8416)))
      ))
    ELSE 0 END as confidence_score,
    -- Reddit-style hot score with time decay
    CASE 
      WHEN (vs.upvotes + vs.downvotes) > 0 THEN
        LOG(GREATEST(1, vs.upvotes + vs.downvotes)) +
        (vs.upvotes - vs.downvotes)::FLOAT / 
        GREATEST(1, vs.upvotes + vs.downvotes) / 
        POWER((vs.hours_since_created + 2), 1.8)
      ELSE 0
    END as hot_score
  FROM products p
  JOIN vote_stats vs ON vs.id = p.id
)
SELECT 
  s.*,
  RANK() OVER (
    ORDER BY s.hot_score DESC, 
            s.confidence_score DESC, 
            s.upvotes DESC, 
            s.created_at DESC
  ) as rank,
  RANK() OVER (
    PARTITION BY s.category 
    ORDER BY s.hot_score DESC, 
            s.confidence_score DESC, 
            s.upvotes DESC, 
            s.created_at DESC
  ) as category_rank
FROM scores s;

-- Create indexes
CREATE UNIQUE INDEX ON product_rankings(id);
CREATE INDEX ON product_rankings(category, rank);
CREATE INDEX ON product_rankings(hot_score DESC);
CREATE INDEX ON product_rankings(confidence_score DESC);

-- Update the refresh function
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
END
$$;

-- Create triggers to refresh rankings
CREATE TRIGGER refresh_rankings_vote
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_product_rankings();

CREATE TRIGGER refresh_rankings_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_product_rankings();

-- Improve rate limiting for anonymous votes
CREATE OR REPLACE FUNCTION handle_anonymous_vote(
  p_product_id UUID,
  p_vote_type TEXT,
  p_ip_address TEXT
)
RETURNS TABLE (success BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_last_vote TIMESTAMPTZ;
  v_vote_count INT;
BEGIN
  -- Get the last vote time and count for this IP
  SELECT 
    MAX(created_at),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour')
  INTO v_last_vote, v_vote_count
  FROM votes
  WHERE metadata->>'ip_address' = p_ip_address
  AND created_at > NOW() - INTERVAL '24 hours';

  -- Check rate limits
  IF v_vote_count >= 10 THEN
    RETURN QUERY SELECT false;
    RETURN;
  END IF;

  IF v_last_vote IS NOT NULL AND v_last_vote > NOW() - INTERVAL '30 seconds' THEN
    RETURN QUERY SELECT false;
    RETURN;
  END IF;

  -- Insert the vote
  INSERT INTO votes (product_id, vote_type, metadata)
  VALUES (
    p_product_id,
    p_vote_type,
    jsonb_build_object(
      'ip_address', p_ip_address,
      'rate_limit_key', concat(p_ip_address, ':', date_trunc('hour', NOW()))
    )
  );

  RETURN QUERY SELECT true;
END;
$$;

-- Recreate the anonymous voting policy
CREATE POLICY "Anonymous users can vote with rate limiting"
  ON votes FOR INSERT
  TO public
  WITH CHECK (
    user_id IS NULL AND
    EXISTS (
      SELECT 1
      FROM handle_anonymous_vote(product_id, vote_type, current_setting('request.headers')::json->>'x-real-ip')
      WHERE success = true
    )
  );

 
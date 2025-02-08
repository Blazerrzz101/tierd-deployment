-- 1. Votes Table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vote_type SMALLINT NOT NULL CHECK (vote_type BETWEEN -1 AND 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, user_id)
);

-- 2. Ranking Materialized View
CREATE MATERIALIZED VIEW product_rankings AS
SELECT 
  p.id,
  p.name,
  COUNT(v.*) FILTER (WHERE v.vote_type = 1) AS upvotes,
  COUNT(v.*) FILTER (WHERE v.vote_type = -1) AS downvotes,
  (COUNT(v.*) FILTER (WHERE v.vote_type = 1) - 
   COUNT(v.*) FILTER (WHERE v.vote_type = -1)) AS net_score,
  RANK() OVER (ORDER BY (COUNT(v.*) FILTER (WHERE v.vote_type = 1) - 
               COUNT(v.*) FILTER (WHERE v.vote_type = -1)) DESC) AS rank
FROM products p
LEFT JOIN votes v ON p.id = v.product_id
GROUP BY p.id;

-- 3. Refresh Ranking Function
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Vote Trigger
CREATE TRIGGER update_rankings
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_product_rankings();

-- 5. Security Policies
CREATE POLICY "User can manage own votes"
ON votes
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public product visibility"
ON products
FOR SELECT
USING (true);

-- 6. Indexes for Performance
CREATE INDEX idx_product_rankings ON product_rankings (net_score, rank);
CREATE INDEX idx_votes_product ON votes (product_id);
CREATE INDEX idx_votes_user ON votes (user_id); 
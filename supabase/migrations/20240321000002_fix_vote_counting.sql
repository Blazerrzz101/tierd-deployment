-- Drop existing materialized view
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Create improved materialized view with fixed vote counting
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_stats AS (
  SELECT 
    p.id,
    COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type::integer = 1), 0) as upvotes,
    COALESCE(COUNT(v.*) FILTER (WHERE v.vote_type::integer = -1), 0) as downvotes,
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

-- Refresh rankings
SELECT refresh_product_rankings(); 
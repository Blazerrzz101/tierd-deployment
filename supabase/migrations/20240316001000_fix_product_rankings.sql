-- Drop the existing view if it exists
DROP MATERIALIZED VIEW IF EXISTS product_rankings;

-- Recreate the materialized view with proper structure
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_counts AS (
  SELECT 
    product_id,
    COUNT(CASE WHEN vote_type = 'up' THEN 1 END) as upvotes,
    COUNT(CASE WHEN vote_type = 'down' THEN 1 END) as downvotes
  FROM product_votes
  GROUP BY product_id
),
rankings AS (
  SELECT 
    p.id,
    p.name,
    p.category,
    COALESCE(vc.upvotes, 0) as upvotes,
    COALESCE(vc.downvotes, 0) as downvotes,
    COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0) as net_score,
    ROW_NUMBER() OVER (PARTITION BY p.category ORDER BY (COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0)) DESC) as rank
  FROM products p
  LEFT JOIN vote_counts vc ON p.id = vc.product_id
)
SELECT * FROM rankings;

-- Create a unique index on id to enable foreign key references
CREATE UNIQUE INDEX product_rankings_id_idx ON product_rankings (id);

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW product_rankings;

-- Grant necessary permissions
GRANT SELECT ON product_rankings TO anon, authenticated; 
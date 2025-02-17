-- Create materialized view for product rankings
CREATE MATERIALIZED VIEW product_rankings AS
WITH vote_counts AS (
  SELECT 
    product_id,
    COUNT(CASE WHEN vote_type = 1 THEN 1 END) as upvotes,
    COUNT(CASE WHEN vote_type = -1 THEN 1 END) as downvotes
  FROM votes
  GROUP BY product_id
)
SELECT 
  p.id,
  p.name,
  p.description,
  p.image_url,
  p.price,
  p.category,
  p.url_slug,
  p.specifications,
  COALESCE(vc.upvotes, 0) as upvotes,
  COALESCE(vc.downvotes, 0) as downvotes,
  COALESCE(vc.upvotes, 0) - COALESCE(vc.downvotes, 0) as score
FROM products p
LEFT JOIN vote_counts vc ON p.id = vc.product_id
GROUP BY 
  p.id, 
  p.name,
  p.description,
  p.image_url,
  p.price,
  p.category,
  p.url_slug,
  p.specifications,
  vc.upvotes,
  vc.downvotes;

-- Create index on score for faster sorting
CREATE INDEX idx_product_rankings_score ON product_rankings(score DESC);

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_product_rankings()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW product_rankings;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh rankings when votes change
CREATE TRIGGER refresh_rankings_on_vote
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_product_rankings();
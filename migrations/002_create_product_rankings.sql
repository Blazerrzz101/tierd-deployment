-- Create materialized view for product rankings
CREATE MATERIALIZED VIEW IF NOT EXISTS product_rankings AS
SELECT 
  p.id,
  p.name,
  COALESCE(SUM(CASE WHEN v.vote_type = 1 THEN 1 ELSE 0 END), 0) as upvotes,
  COALESCE(SUM(CASE WHEN v.vote_type = -1 THEN 1 ELSE 0 END), 0) as downvotes,
  COALESCE(AVG(r.rating), 0) as rating,
  COUNT(DISTINCT r.id) as review_count
FROM products p
LEFT JOIN votes v ON p.id = v.product_id
LEFT JOIN reviews r ON p.id = r.product_id
GROUP BY p.id, p.name;

-- Create index on product_rankings
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_rankings_id ON product_rankings(id);

-- Create function to refresh rankings
CREATE OR REPLACE FUNCTION refresh_rankings()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to refresh rankings when votes or reviews change
CREATE OR REPLACE FUNCTION refresh_rankings_trigger()
RETURNS trigger AS $$
BEGIN
  PERFORM refresh_rankings();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh rankings
DROP TRIGGER IF EXISTS refresh_rankings_votes ON votes;
CREATE TRIGGER refresh_rankings_votes
AFTER INSERT OR UPDATE OR DELETE ON votes
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_rankings_trigger();

DROP TRIGGER IF EXISTS refresh_rankings_reviews ON reviews;
CREATE TRIGGER refresh_rankings_reviews
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_rankings_trigger();

-- Initial refresh of rankings
SELECT refresh_rankings(); 
-- Drop existing triggers
DROP TRIGGER IF EXISTS refresh_rankings_vote ON votes;
DROP TRIGGER IF EXISTS refresh_rankings_review ON reviews;

-- Create trigger function
CREATE OR REPLACE FUNCTION trigger_refresh_rankings()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM refresh_product_rankings();
  RETURN NULL;
END;
$$;

-- Create triggers
CREATE TRIGGER refresh_rankings_vote
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_rankings();

CREATE TRIGGER refresh_rankings_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_rankings();

-- Refresh rankings
SELECT refresh_product_rankings(); 
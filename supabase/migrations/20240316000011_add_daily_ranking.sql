-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Add last_ranked_at column to products
ALTER TABLE products ADD COLUMN IF NOT EXISTS last_ranked_at TIMESTAMP WITH TIME ZONE;

-- Create function to update product rankings with time decay
CREATE OR REPLACE FUNCTION update_product_rankings_with_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update rankings for all products
  UPDATE products
  SET 
    rank = subquery.score,
    last_ranked_at = NOW()
  FROM (
    SELECT 
      p.id,
      COALESCE(
        SUM(
          CASE 
            WHEN pv.vote_type = 'up' THEN 1
            WHEN pv.vote_type = 'down' THEN -1
            ELSE 0
          END * 
          -- Apply time decay: votes within last 24h count fully, then decay by 50% each day
          POWER(0.5, EXTRACT(EPOCH FROM (NOW() - pv.created_at)) / (24 * 3600))
        ),
        0
      ) as score
    FROM products p
    LEFT JOIN product_votes pv ON p.id = pv.product_id
    GROUP BY p.id
  ) subquery
  WHERE products.id = subquery.id;
END;
$$;

-- Create a trigger to update rankings when votes change
CREATE OR REPLACE FUNCTION trigger_update_product_rank()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the specific product's ranking
  UPDATE products
  SET rank = (
    SELECT COALESCE(
      SUM(
        CASE 
          WHEN vote_type = 'up' THEN 1
          WHEN vote_type = 'down' THEN -1
          ELSE 0
        END
      ),
      0
    )
    FROM product_votes
    WHERE product_id = NEW.product_id
  )
  WHERE id = NEW.product_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for vote changes
DROP TRIGGER IF EXISTS update_product_rank ON product_votes;
CREATE TRIGGER update_product_rank
AFTER INSERT OR UPDATE OR DELETE ON product_votes
FOR EACH ROW
EXECUTE FUNCTION trigger_update_product_rank();

-- Create a cron job to update rankings daily (requires pg_cron extension)
SELECT cron.schedule(
  'update-product-rankings',
  '0 0 * * *', -- Run at midnight every day
  $$
    SELECT update_product_rankings_with_decay();
  $$
); 
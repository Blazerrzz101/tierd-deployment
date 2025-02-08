-- Create function to update product rankings
CREATE OR REPLACE FUNCTION update_product_rankings(product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the product's ranking based on votes
  UPDATE products
  SET rank = (
    SELECT COALESCE(
      (
        SELECT COUNT(*) FILTER (WHERE vote_type = 'up') -
        COUNT(*) FILTER (WHERE vote_type = 'down')
      ),
      0
    )
    FROM product_votes
    WHERE product_votes.product_id = products.id
  )
  WHERE id = product_id;
END;
$$; 
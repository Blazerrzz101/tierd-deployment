CREATE OR REPLACE FUNCTION get_product_rankings(p_category text DEFAULT NULL)
RETURNS SETOF product_rankings
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_category IS NULL THEN
    RETURN QUERY SELECT * FROM product_rankings ORDER BY category_slug, rank;
  ELSE
    RETURN QUERY SELECT * FROM product_rankings WHERE category_slug = p_category ORDER BY rank;
  END IF;
END;
$$; 
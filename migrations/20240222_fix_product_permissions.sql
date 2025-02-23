-- Enable RLS on tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Grant access to product_rankings view
GRANT SELECT ON product_rankings TO authenticated, anon;

-- Ensure function permissions are correct
GRANT EXECUTE ON FUNCTION get_product_rankings(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_product_details(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION vote_for_product(uuid, text) TO authenticated; 
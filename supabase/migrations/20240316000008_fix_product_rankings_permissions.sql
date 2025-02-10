-- Enable RLS for product_rankings view
ALTER MATERIALIZED VIEW product_rankings OWNER TO authenticated;

-- Grant SELECT to public and authenticated roles
GRANT SELECT ON product_rankings TO public;
GRANT SELECT ON product_rankings TO authenticated;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings; 
-- Fix relationships between tables
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE reviews ADD CONSTRAINT reviews_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE threads DROP CONSTRAINT IF EXISTS threads_user_id_fkey;
ALTER TABLE threads ADD CONSTRAINT threads_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate get_product_details function with updated return type
DROP FUNCTION IF EXISTS get_product_details(TEXT);

-- Update get_product_details function to include user data
CREATE OR REPLACE FUNCTION get_product_details(p_slug TEXT)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  category text,
  price numeric,
  image_url text,
  url_slug text,
  specifications jsonb,
  is_published boolean,
  created_at timestamptz,
  updated_at timestamptz,
  upvotes bigint,
  downvotes bigint,
  user_vote text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.description,
    p.category,
    p.price,
    p.image_url,
    p.url_slug,
    p.specifications,
    p.is_published,
    p.created_at,
    p.updated_at,
    COALESCE(v.upvotes, 0) as upvotes,
    COALESCE(v.downvotes, 0) as downvotes,
    COALESCE(uv.vote_type, NULL) as user_vote
  FROM products p
  LEFT JOIN (
    SELECT 
      product_id,
      COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
      COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
    FROM votes 
    GROUP BY product_id
  ) v ON v.product_id = p.id
  LEFT JOIN votes uv ON uv.product_id = p.id 
    AND uv.user_id = auth.uid()
  WHERE p.url_slug = p_slug
    AND p.is_published = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_product_details(TEXT) TO authenticated, anon; 
-- Remove unused categories
DELETE FROM categories 
WHERE id IN ('controllers', 'gaming-chairs', 'mousepads', 'microphones');

-- Create or update product votes table
CREATE TABLE IF NOT EXISTS product_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(4) NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Function to update product rankings based on votes
CREATE OR REPLACE FUNCTION update_product_rankings()
RETURNS TRIGGER AS $$
DECLARE
  vote_value INT;
  time_decay FLOAT;
BEGIN
  -- Calculate vote value (1 for upvote, -1 for downvote)
  vote_value := CASE
    WHEN NEW.vote_type = 'up' THEN 1
    WHEN NEW.vote_type = 'down' THEN -1
    ELSE 0
  END;

  -- Calculate time decay (newer votes have more weight)
  time_decay := EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - NEW.created_at))/3600);

  -- Update product's vote count and ranking score
  UPDATE products
  SET 
    votes = (
      SELECT COUNT(CASE WHEN vote_type = 'up' THEN 1 END) -
             COUNT(CASE WHEN vote_type = 'down' THEN 1 END)
      FROM product_votes
      WHERE product_id = NEW.product_id
    ),
    ranking_score = (
      SELECT SUM(
        CASE 
          WHEN vote_type = 'up' THEN 1
          WHEN vote_type = 'down' THEN -1
        END * EXP(-0.1 * EXTRACT(EPOCH FROM (NOW() - created_at))/3600)
      )
      FROM product_votes
      WHERE product_id = NEW.product_id
    )
  WHERE id = NEW.product_id;

  -- Update category rankings
  UPDATE categories
  SET ranking_score = (
    SELECT AVG(ranking_score)
    FROM products
    WHERE category = (
      SELECT category 
      FROM products 
      WHERE id = NEW.product_id
    )
  )
  WHERE id = (
    SELECT category 
    FROM products 
    WHERE id = NEW.product_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating rankings on vote
CREATE TRIGGER update_rankings_on_vote
  AFTER INSERT OR UPDATE ON product_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rankings();

-- Enable RLS
ALTER TABLE product_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for product_votes
CREATE POLICY "Allow users to vote"
  ON product_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to change their votes"
  ON product_votes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their votes"
  ON product_votes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Allow public read access to votes"
  ON product_votes
  FOR SELECT
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_product_votes_product_id ON product_votes(product_id);
CREATE INDEX idx_product_votes_user_id ON product_votes(user_id);
CREATE INDEX idx_product_votes_created_at ON product_votes(created_at);
CREATE INDEX idx_products_ranking_score ON products(ranking_score DESC);
CREATE INDEX idx_products_category_ranking ON products(category, ranking_score DESC);

-- Add notification trigger for votes
CREATE OR REPLACE FUNCTION notify_product_vote()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify product owner and followers
  INSERT INTO notifications (
    user_id,
    type,
    data,
    read
  )
  SELECT 
    user_id,
    'product_vote',
    jsonb_build_object(
      'product_id', NEW.product_id,
      'vote_type', NEW.vote_type
    ),
    false
  FROM product_followers
  WHERE product_id = NEW.product_id
  AND user_id != NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_product_vote
  AFTER INSERT ON product_votes
  FOR EACH ROW
  EXECUTE FUNCTION notify_product_vote(); 
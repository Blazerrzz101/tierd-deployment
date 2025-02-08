/*
  # Add product votes table

  1. New Tables
    - `product_votes`
      - `id` (uuid, primary key)
      - `product_id` (text, required)
      - `user_id` (uuid, required)
      - `vote_type` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  2. Security
    - Enable RLS
    - Add policies for vote management
*/

CREATE TABLE product_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  vote_type text CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE product_votes ENABLE ROW LEVEL SECURITY;

-- Allow users to read votes
CREATE POLICY "Users can read all votes"
  ON product_votes FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to vote
CREATE POLICY "Users can manage their own votes"
  ON product_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Function to update product rankings
CREATE OR REPLACE FUNCTION update_product_ranking()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product votes count and ranking
  -- This is a placeholder - implement actual ranking logic
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rankings on vote changes
CREATE TRIGGER update_ranking_on_vote
  AFTER INSERT OR UPDATE OR DELETE ON product_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_product_ranking();
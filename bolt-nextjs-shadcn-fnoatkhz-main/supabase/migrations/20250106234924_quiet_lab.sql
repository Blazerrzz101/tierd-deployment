/*
  # Add Product Votes Table

  1. New Tables
    - `product_votes` for tracking user votes on products
      - `id` (uuid, primary key)
      - `product_id` (text)
      - `user_id` (uuid, references users)
      - `vote_type` (text - 'up' or 'down')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for vote management
*/

CREATE TABLE IF NOT EXISTS product_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  vote_type text CHECK (vote_type IN ('up', 'down')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE product_votes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all votes
CREATE POLICY "Users can read all votes"
  ON product_votes FOR SELECT
  TO authenticated
  USING (true);

-- Allow users to manage their own votes
CREATE POLICY "Users can manage their own votes"
  ON product_votes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_votes_updated_at
    BEFORE UPDATE ON product_votes
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
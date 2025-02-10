-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated users to vote" ON votes;

-- Create policy to allow authenticated users to vote
CREATE POLICY "Allow authenticated users to vote"
ON votes
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_votes_updated_at ON votes;

-- Create trigger
CREATE TRIGGER update_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 
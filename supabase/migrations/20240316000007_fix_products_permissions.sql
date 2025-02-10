-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access
CREATE POLICY "Allow public read access"
ON products
FOR SELECT
TO public
USING (true);

-- Create policy to allow authenticated users to vote
CREATE POLICY "Allow authenticated users to vote"
ON votes
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Create policy to allow authenticated users to review
CREATE POLICY "Allow authenticated users to review"
ON reviews
FOR ALL
TO authenticated
USING (auth.uid() = user_id); 
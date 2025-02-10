-- Create votes table if it doesn't exist
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down', 'neutral')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to vote
CREATE POLICY "Allow authenticated users to vote"
ON votes
FOR ALL
TO authenticated
USING (auth.uid() = user_id); 
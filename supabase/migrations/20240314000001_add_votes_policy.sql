-- Migration: Add Votes Policy
-- Description: Adds additional policies and functions for vote management
-- Author: James Montgomery
-- Date: 2024-03-14

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

-- Function to check if a user has reached their daily vote limit
CREATE OR REPLACE FUNCTION public.check_vote_limit(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    vote_count int;
    max_votes int := 50; -- Maximum votes per day
BEGIN
    -- Count votes in the last 24 hours
    SELECT COUNT(*)
    INTO vote_count
    FROM public.votes
    WHERE votes.user_id = check_vote_limit.user_id
    AND created_at > now() - interval '24 hours';

    RETURN vote_count < max_votes;
END;
$$;

-- Function to check anonymous vote limit by IP
CREATE OR REPLACE FUNCTION public.check_anonymous_vote_limit(client_ip text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    vote_count int;
    max_votes int := 5; -- Maximum anonymous votes per day per IP
BEGIN
    -- Count anonymous votes from this IP in the last 24 hours
    SELECT COUNT(*)
    INTO vote_count
    FROM public.votes
    WHERE user_id = 'anonymous'
    AND client_ip = check_anonymous_vote_limit.client_ip
    AND created_at > now() - interval '24 hours';

    RETURN vote_count < max_votes;
END;
$$;

-- Add policy to enforce vote limits
CREATE POLICY "Enforce vote limits"
    ON public.votes
    FOR INSERT
    TO public
    WITH CHECK (
        CASE 
            WHEN auth.uid() IS NOT NULL THEN
                public.check_vote_limit(auth.uid())
            ELSE
                public.check_anonymous_vote_limit(request.header('X-Real-IP'))
        END
    ); 
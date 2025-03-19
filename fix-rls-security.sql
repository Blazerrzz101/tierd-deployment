-- Enable RLS on tables flagged in the Security Advisor
-- This script addresses the security warnings shown in the Supabase dashboard

-- 1. Enable RLS on anonymous_votes table
ALTER TABLE IF EXISTS public.anonymous_votes ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to see all anonymous votes
CREATE POLICY "Allow authenticated users to read anonymous votes" 
ON public.anonymous_votes
FOR SELECT 
TO authenticated
USING (true);

-- Create a policy to allow users to manage their own anonymous votes
CREATE POLICY "Users can manage their own anonymous votes" 
ON public.anonymous_votes
FOR ALL 
TO authenticated
USING (client_id = current_user_id() OR client_id = auth.uid()::text);

-- Create a policy to allow anonymous users to create votes with their client_id
CREATE POLICY "Anonymous users can create votes with their client_id" 
ON public.anonymous_votes
FOR INSERT 
TO anon
WITH CHECK (client_id IS NOT NULL);

-- 2. Enable RLS on error_logs table
ALTER TABLE IF EXISTS public.error_logs ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to view error logs
CREATE POLICY "Authenticated users can view error logs" 
ON public.error_logs
FOR SELECT 
TO authenticated
USING (true);

-- Create a policy to allow service role to manage error logs
CREATE POLICY "Service role can manage all error logs" 
ON public.error_logs
FOR ALL 
TO service_role
USING (true);

-- Create a policy to allow users to create error logs
CREATE POLICY "Any user can create error logs" 
ON public.error_logs
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

-- 3. Ensure the votes table has RLS enabled too
ALTER TABLE IF EXISTS public.votes ENABLE ROW LEVEL SECURITY;

-- Create policy for votes table if not already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'votes' AND policyname = 'Users can manage their own votes'
    ) THEN
        CREATE POLICY "Users can manage their own votes" 
        ON public.votes
        FOR ALL 
        TO authenticated
        USING (
            user_id = auth.uid() OR 
            (metadata->>'client_id')::text = auth.uid()::text OR
            (user_id IS NULL AND EXISTS (
                SELECT 1 FROM public.anonymous_votes 
                WHERE anonymous_votes.client_id = (votes.metadata->>'client_id')::text
            ))
        );
    END IF;
END
$$; 
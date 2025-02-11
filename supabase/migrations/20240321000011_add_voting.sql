-- Create votes table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(product_id, user_id)
);

-- Enable RLS
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read all votes"
    ON public.votes
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own votes"
    ON public.votes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
    ON public.votes
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
    ON public.votes
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to refresh product rankings
CREATE OR REPLACE FUNCTION public.refresh_product_rankings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update product rankings based on votes
    UPDATE public.product_rankings pr
    SET
        upvotes = COALESCE(v.upvotes, 0),
        downvotes = COALESCE(v.downvotes, 0),
        net_score = COALESCE(v.upvotes, 0) - COALESCE(v.downvotes, 0),
        updated_at = NOW()
    FROM (
        SELECT
            product_id,
            COUNT(*) FILTER (WHERE vote_type = 'up') as upvotes,
            COUNT(*) FILTER (WHERE vote_type = 'down') as downvotes
        FROM public.votes
        GROUP BY product_id
    ) v
    WHERE pr.product_id = v.product_id;

    -- Update ranks
    UPDATE public.product_rankings
    SET rank = ranked.rank
    FROM (
        SELECT
            product_id,
            ROW_NUMBER() OVER (ORDER BY net_score DESC, upvotes DESC, created_at ASC) as rank
        FROM public.product_rankings
    ) ranked
    WHERE public.product_rankings.product_id = ranked.product_id;
END;
$$;

-- Create trigger to refresh rankings on vote changes
CREATE OR REPLACE FUNCTION public.handle_vote_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM public.refresh_product_rankings();
    RETURN NULL;
END;
$$;

CREATE TRIGGER refresh_rankings_on_vote
    AFTER INSERT OR UPDATE OR DELETE ON public.votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION public.handle_vote_change();

-- Grant permissions
GRANT SELECT ON public.votes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.votes TO authenticated;
GRANT USAGE ON SEQUENCE public.votes_id_seq TO authenticated;

-- Create function to get user's vote for a product
CREATE OR REPLACE FUNCTION public.get_user_vote(product_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_vote TEXT;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT vote_type INTO user_vote
    FROM public.votes
    WHERE product_id = $1
    AND user_id = auth.uid();

    RETURN user_vote;
END;
$$; 
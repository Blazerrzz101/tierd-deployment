-- Enable RLS on product_votes table
ALTER TABLE public.product_votes ENABLE ROW LEVEL SECURITY;

-- Create policies for product_votes
CREATE POLICY "Users can view all votes"
    ON public.product_votes
    FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can create votes"
    ON public.product_votes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes"
    ON public.product_votes
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
    ON public.product_votes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to prevent duplicate votes
CREATE OR REPLACE FUNCTION check_duplicate_vote()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if user has already voted on this product
    IF EXISTS (
        SELECT 1 
        FROM public.product_votes 
        WHERE product_id = NEW.product_id 
        AND user_id = NEW.user_id 
        AND id != NEW.id
    ) THEN
        -- If updating an existing vote, allow it
        IF TG_OP = 'UPDATE' THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'User has already voted on this product';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent duplicate votes
DROP TRIGGER IF EXISTS prevent_duplicate_votes ON public.product_votes;
CREATE TRIGGER prevent_duplicate_votes
    BEFORE INSERT OR UPDATE ON public.product_votes
    FOR EACH ROW
    EXECUTE FUNCTION check_duplicate_vote();

-- Ensure product_votes table has proper indexes
CREATE INDEX IF NOT EXISTS idx_product_votes_user_id ON public.product_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_product_votes_product_id ON public.product_votes(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_votes_user_product ON public.product_votes(user_id, product_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_votes TO authenticated;
GRANT USAGE ON SEQUENCE public.product_votes_id_seq TO authenticated; 
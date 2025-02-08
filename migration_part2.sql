-- Create functions to update vote counts
CREATE OR REPLACE FUNCTION update_thread_vote_counts()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE threads SET upvotes = upvotes + 1 WHERE id = NEW.thread_id;
        ELSE
            UPDATE threads SET downvotes = downvotes + 1 WHERE id = NEW.thread_id;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.vote_type = 'upvote' THEN
            UPDATE threads SET upvotes = upvotes - 1 WHERE id = OLD.thread_id;
        ELSE
            UPDATE threads SET downvotes = downvotes - 1 WHERE id = OLD.thread_id;
        END IF;
    ELSIF TG_OP = 'UPDATE' AND OLD.vote_type != NEW.vote_type THEN
        IF NEW.vote_type = 'upvote' THEN
            UPDATE threads SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = NEW.thread_id;
        ELSE
            UPDATE threads SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = NEW.thread_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote counts
DROP TRIGGER IF EXISTS thread_votes_trigger ON thread_votes;
CREATE TRIGGER thread_votes_trigger
AFTER INSERT OR UPDATE OR DELETE ON thread_votes
FOR EACH ROW EXECUTE FUNCTION update_thread_vote_counts();

-- Create function to update comment counts
CREATE OR REPLACE FUNCTION update_thread_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE threads SET comment_count = comment_count + 1 WHERE id = NEW.thread_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE threads SET comment_count = comment_count - 1 WHERE id = OLD.thread_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for comment counts
DROP TRIGGER IF EXISTS thread_comments_trigger ON thread_comments;
CREATE TRIGGER thread_comments_trigger
AFTER INSERT OR DELETE ON thread_comments
FOR EACH ROW EXECUTE FUNCTION update_thread_comment_count();

-- Enable RLS
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.thread_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Threads are viewable by everyone" ON public.threads;
DROP POLICY IF EXISTS "Users can create threads" ON public.threads;
DROP POLICY IF EXISTS "Users can update their own threads" ON public.threads;
DROP POLICY IF EXISTS "Thread products are viewable by everyone" ON public.thread_products;
DROP POLICY IF EXISTS "Users can create thread product relations" ON public.thread_products;
DROP POLICY IF EXISTS "Thread votes are viewable by everyone" ON public.thread_votes;
DROP POLICY IF EXISTS "Users can vote on threads" ON public.thread_votes;
DROP POLICY IF EXISTS "Users can change their votes" ON public.thread_votes;
DROP POLICY IF EXISTS "Users can remove their votes" ON public.thread_votes;
DROP POLICY IF EXISTS "Thread comments are viewable by everyone" ON public.thread_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.thread_comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.thread_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.thread_comments;

-- Create RLS policies
CREATE POLICY "Threads are viewable by everyone"
ON public.threads FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create threads"
ON public.threads FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own threads"
ON public.threads FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Thread products policies
CREATE POLICY "Thread products are viewable by everyone"
ON public.thread_products FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create thread product relations"
ON public.thread_products FOR INSERT
TO authenticated
WITH CHECK (EXISTS (
    SELECT 1 FROM threads WHERE id = thread_id AND user_id = auth.uid()
));

-- Thread votes policies
CREATE POLICY "Thread votes are viewable by everyone"
ON public.thread_votes FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can vote on threads"
ON public.thread_votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their votes"
ON public.thread_votes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes"
ON public.thread_votes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Thread comments policies
CREATE POLICY "Thread comments are viewable by everyone"
ON public.thread_comments FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can create comments"
ON public.thread_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
ON public.thread_comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
ON public.thread_comments FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Verify triggers were created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('thread_votes', 'thread_comments'); 
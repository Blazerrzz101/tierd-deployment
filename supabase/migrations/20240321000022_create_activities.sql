-- Create activities table
CREATE TABLE IF NOT EXISTS public.activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('vote', 'comment', 'thread')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for faster user activity lookups
CREATE INDEX IF NOT EXISTS idx_activities_user_time ON activities(user_id, created_at DESC);

-- Create function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
    p_user_id UUID,
    p_type TEXT,
    p_details JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO activities (user_id, type, details)
    VALUES (p_user_id, p_type, p_details)
    RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$;

-- Grant necessary permissions
GRANT ALL ON public.activities TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE activities_id_seq TO authenticated;

-- Create trigger to log vote activities
CREATE OR REPLACE FUNCTION public.log_vote_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.log_activity(
            NEW.user_id,
            'vote',
            jsonb_build_object(
                'product_id', NEW.product_id,
                'vote_type', NEW.vote_type,
                'action', 'created'
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM public.log_activity(
            NEW.user_id,
            'vote',
            jsonb_build_object(
                'product_id', NEW.product_id,
                'vote_type', NEW.vote_type,
                'action', 'updated'
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.log_activity(
            OLD.user_id,
            'vote',
            jsonb_build_object(
                'product_id', OLD.product_id,
                'vote_type', OLD.vote_type,
                'action', 'deleted'
            )
        );
    END IF;
    RETURN NULL;
END;
$$;

-- Create trigger for vote activities
DROP TRIGGER IF EXISTS log_vote_activity_trigger ON votes;
CREATE TRIGGER log_vote_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION public.log_vote_activity(); 
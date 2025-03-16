-- Create activity log table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON public.activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own activity"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all activity"
    ON public.activity_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Enhanced activity logging function
CREATE OR REPLACE FUNCTION public.log_activity(
    p_activity_type TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_ip_address TEXT;
    v_user_agent TEXT;
    v_log_id UUID;
BEGIN
    -- Get current user if authenticated
    v_user_id := auth.uid();
    
    -- Get request metadata
    v_ip_address := current_setting('request.headers', true)::json->>'x-real-ip';
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
    
    -- Insert activity log
    INSERT INTO public.activity_logs (
        user_id,
        activity_type,
        entity_type,
        entity_id,
        metadata,
        ip_address,
        user_agent
    )
    VALUES (
        v_user_id,
        p_activity_type,
        p_entity_type,
        p_entity_id,
        COALESCE(p_metadata, '{}'::jsonb),
        v_ip_address,
        v_user_agent
    )
    RETURNING id INTO v_log_id;
    
    -- Update user's last activity
    IF v_user_id IS NOT NULL THEN
        UPDATE public.user_profiles
        SET last_seen = NOW()
        WHERE id = v_user_id;
    END IF;
    
    RETURN v_log_id;
END;
$$;

-- Create function to get user activity
CREATE OR REPLACE FUNCTION public.get_user_activity(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    activity_type TEXT,
    entity_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- If no user_id provided, use current user
    p_user_id := COALESCE(p_user_id, auth.uid());
    
    IF p_user_id IS NULL THEN
        RAISE EXCEPTION 'User ID is required';
    END IF;
    
    -- Check if user has permission to view activity
    IF p_user_id != auth.uid() AND NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized to view this user''s activity';
    END IF;
    
    RETURN QUERY
    SELECT 
        al.id,
        al.activity_type,
        al.entity_type,
        al.entity_id,
        al.metadata,
        al.created_at
    FROM public.activity_logs al
    WHERE al.user_id = p_user_id
    ORDER BY al.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Create suspicious activity monitoring function
CREATE OR REPLACE FUNCTION public.check_suspicious_activity(
    p_ip_address TEXT,
    p_user_id UUID DEFAULT NULL,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_activity_count INTEGER;
    v_unique_entities INTEGER;
    v_is_suspicious BOOLEAN := FALSE;
    v_reason TEXT[];
BEGIN
    -- Count recent activities
    SELECT COUNT(*)
    INTO v_activity_count
    FROM public.activity_logs
    WHERE (ip_address = p_ip_address OR (p_user_id IS NOT NULL AND user_id = p_user_id))
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Count unique entities affected
    SELECT COUNT(DISTINCT entity_id)
    INTO v_unique_entities
    FROM public.activity_logs
    WHERE (ip_address = p_ip_address OR (p_user_id IS NOT NULL AND user_id = p_user_id))
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Check for suspicious patterns
    IF v_activity_count > 100 THEN
        v_is_suspicious := TRUE;
        v_reason := array_append(v_reason, 'High activity volume');
    END IF;
    
    IF v_unique_entities > 50 THEN
        v_is_suspicious := TRUE;
        v_reason := array_append(v_reason, 'Too many unique entities');
    END IF;
    
    RETURN jsonb_build_object(
        'is_suspicious', v_is_suspicious,
        'activity_count', v_activity_count,
        'unique_entities', v_unique_entities,
        'reasons', v_reason,
        'window_minutes', p_window_minutes
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_suspicious_activity TO authenticated; 
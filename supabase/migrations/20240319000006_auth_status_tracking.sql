-- Create auth status tracking table
CREATE TABLE IF NOT EXISTS public.auth_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_auth_status_logs_user_id ON public.auth_status_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_status_logs_status_type ON public.auth_status_logs(status_type);
CREATE INDEX IF NOT EXISTS idx_auth_status_logs_created_at ON public.auth_status_logs(created_at DESC);

-- Enable RLS
ALTER TABLE public.auth_status_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own auth status logs"
    ON public.auth_status_logs FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all auth status logs"
    ON public.auth_status_logs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Create function to log auth status changes
CREATE OR REPLACE FUNCTION public.log_auth_status_change(
    p_status_type TEXT,
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
    -- Get current user
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User must be authenticated';
    END IF;
    
    -- Get request metadata
    v_ip_address := current_setting('request.headers', true)::json->>'x-real-ip';
    v_user_agent := current_setting('request.headers', true)::json->>'user-agent';
    
    -- Insert status log
    INSERT INTO public.auth_status_logs (
        user_id,
        status_type,
        metadata,
        ip_address,
        user_agent
    )
    VALUES (
        v_user_id,
        p_status_type,
        COALESCE(p_metadata, '{}'::jsonb),
        v_ip_address,
        v_user_agent
    )
    RETURNING id INTO v_log_id;
    
    -- Update user's last seen timestamp
    UPDATE public.user_profiles
    SET last_seen = NOW()
    WHERE id = v_user_id;
    
    RETURN v_log_id;
END;
$$;

-- Create function to get user's auth status history
CREATE OR REPLACE FUNCTION public.get_auth_status_history(
    p_user_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    status_type TEXT,
    metadata JSONB,
    ip_address TEXT,
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
    
    -- Check if user has permission to view history
    IF p_user_id != auth.uid() AND NOT EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized to view this user''s auth history';
    END IF;
    
    RETURN QUERY
    SELECT 
        asl.id,
        asl.status_type,
        asl.metadata,
        asl.ip_address,
        asl.created_at
    FROM public.auth_status_logs asl
    WHERE asl.user_id = p_user_id
    ORDER BY asl.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Create function to check for suspicious auth patterns
CREATE OR REPLACE FUNCTION public.check_suspicious_auth_activity(
    p_user_id UUID,
    p_window_minutes INTEGER DEFAULT 60
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_login_count INTEGER;
    v_unique_ips INTEGER;
    v_is_suspicious BOOLEAN := FALSE;
    v_reason TEXT[];
BEGIN
    -- Count login attempts
    SELECT COUNT(*)
    INTO v_login_count
    FROM public.auth_status_logs
    WHERE user_id = p_user_id
    AND status_type = 'login_attempt'
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Count unique IP addresses
    SELECT COUNT(DISTINCT ip_address)
    INTO v_unique_ips
    FROM public.auth_status_logs
    WHERE user_id = p_user_id
    AND created_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;
    
    -- Check for suspicious patterns
    IF v_login_count > 10 THEN
        v_is_suspicious := TRUE;
        v_reason := array_append(v_reason, 'High number of login attempts');
    END IF;
    
    IF v_unique_ips > 3 THEN
        v_is_suspicious := TRUE;
        v_reason := array_append(v_reason, 'Multiple IP addresses used');
    END IF;
    
    RETURN jsonb_build_object(
        'is_suspicious', v_is_suspicious,
        'login_count', v_login_count,
        'unique_ips', v_unique_ips,
        'reasons', v_reason,
        'window_minutes', p_window_minutes
    );
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.auth_status_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_auth_status_change TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_status_history TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_suspicious_auth_activity TO authenticated; 
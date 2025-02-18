-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "pg_cron" WITH SCHEMA public;

-- Create function to clean up old anonymous votes
CREATE OR REPLACE FUNCTION cleanup_old_anonymous_votes()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete anonymous votes older than 24 hours
    DELETE FROM votes
    WHERE user_id IS NULL
    AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Create a scheduled job to run cleanup every hour
SELECT cron.schedule(
    'cleanup-anonymous-votes',
    '0 * * * *', -- Run every hour
    'SELECT cleanup_old_anonymous_votes()'
);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_old_anonymous_votes() TO postgres;

-- Create functions to monitor voting patterns
CREATE OR REPLACE FUNCTION get_vote_statistics(
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '24 hours',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_votes BIGINT,
    anonymous_votes BIGINT,
    authenticated_votes BIGINT,
    upvotes BIGINT,
    downvotes BIGINT,
    unique_users BIGINT,
    votes_per_hour NUMERIC
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    WITH vote_stats AS (
        SELECT
            COUNT(*) as total_votes,
            COUNT(*) FILTER (WHERE user_id IS NULL) as anonymous_votes,
            COUNT(*) FILTER (WHERE user_id IS NOT NULL) as authenticated_votes,
            COUNT(*) FILTER (WHERE vote_type = 1) as upvotes,
            COUNT(*) FILTER (WHERE vote_type = -1) as downvotes,
            COUNT(DISTINCT user_id) as unique_users,
            COUNT(*)::NUMERIC / EXTRACT(EPOCH FROM (p_end_date - p_start_date)) * 3600 as votes_per_hour
        FROM votes
        WHERE created_at BETWEEN p_start_date AND p_end_date
    )
    SELECT * FROM vote_stats;
END;
$$;

-- Create function to detect suspicious voting patterns
CREATE OR REPLACE FUNCTION detect_suspicious_voting(
    p_threshold INTEGER DEFAULT 10
)
RETURNS TABLE (
    ip_hash TEXT,
    vote_count BIGINT,
    vote_frequency NUMERIC,
    last_vote_time TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        metadata->>'rate_limit_key' as ip_hash,
        COUNT(*) as vote_count,
        COUNT(*)::NUMERIC / EXTRACT(EPOCH FROM (NOW() - MIN(created_at))) * 3600 as vote_frequency,
        MAX(created_at) as last_vote_time
    FROM votes
    WHERE
        created_at > NOW() - INTERVAL '1 hour'
        AND metadata->>'rate_limit_key' IS NOT NULL
    GROUP BY metadata->>'rate_limit_key'
    HAVING COUNT(*) > p_threshold;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_vote_statistics(TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION detect_suspicious_voting(INTEGER) TO authenticated;

-- Create additional indexes for monitoring
CREATE INDEX IF NOT EXISTS idx_votes_created_at ON votes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_user_id_created_at ON votes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_metadata_rate_limit ON votes((metadata->>'rate_limit_key'));
CREATE INDEX IF NOT EXISTS idx_votes_type_created_at ON votes(vote_type, created_at DESC);

-- Add comments for documentation
COMMENT ON FUNCTION get_vote_statistics IS 'Returns voting statistics for a given time period';
COMMENT ON FUNCTION detect_suspicious_voting IS 'Detects potentially suspicious voting patterns based on frequency';
COMMENT ON FUNCTION cleanup_old_anonymous_votes IS 'Removes anonymous votes older than 24 hours'; 
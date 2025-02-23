-- Drop all dependent views first
DROP MATERIALIZED VIEW IF EXISTS product_rankings;
DROP MATERIALIZED VIEW IF EXISTS category_stats;

-- Drop dependent triggers first
DROP TRIGGER IF EXISTS log_vote_activity_trigger ON votes;
DROP TRIGGER IF EXISTS refresh_rankings_trigger ON votes;

-- Drop the check constraint
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;

-- Update vote types
UPDATE public.votes 
SET vote_type = 
    CASE vote_type
        WHEN 1 THEN 1  -- Keep as 1 for now
        ELSE -1
    END;

-- Create function to handle vote type conversion
CREATE OR REPLACE FUNCTION public.get_vote_type_text(vote_type_int integer)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN vote_type_int = 1 THEN 'up'
        ELSE 'down'
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to handle vote type conversion (reverse)
CREATE OR REPLACE FUNCTION public.get_vote_type_int(vote_type_text TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE
        WHEN vote_type_text = 'up' THEN 1
        ELSE -1
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Update vote_for_product function to use text vote types
CREATE OR REPLACE FUNCTION public.vote_for_product(
    p_product_id UUID,
    p_vote_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_existing_vote INTEGER;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate vote type
    IF p_vote_type NOT IN ('up', 'down') THEN
        RAISE EXCEPTION 'Invalid vote type. Must be either up or down';
    END IF;

    -- Convert text vote type to integer
    DECLARE
        v_vote_type_int INTEGER := public.get_vote_type_int(p_vote_type);
    BEGIN
        -- Check for existing vote
        SELECT vote_type INTO v_existing_vote
        FROM votes
        WHERE product_id = p_product_id AND user_id = v_user_id;

        -- Handle the vote
        IF v_existing_vote IS NULL THEN
            -- Insert new vote
            INSERT INTO votes (product_id, user_id, vote_type)
            VALUES (p_product_id, v_user_id, v_vote_type_int);
        ELSIF v_existing_vote = v_vote_type_int THEN
            -- Remove vote if clicking the same type again
            DELETE FROM votes
            WHERE product_id = p_product_id AND user_id = v_user_id;
        ELSE
            -- Update vote if changing from up to down or vice versa
            UPDATE votes
            SET vote_type = v_vote_type_int,
                updated_at = now()
            WHERE product_id = p_product_id AND user_id = v_user_id;
        END IF;

        -- Log activity
        PERFORM public.log_activity(
            v_user_id,
            'vote',
            jsonb_build_object(
                'product_id', p_product_id,
                'vote_type', p_vote_type
            )
        );
    END;
END;
$$;

-- Recreate the check constraint
ALTER TABLE public.votes 
    ADD CONSTRAINT votes_vote_type_check 
    CHECK (vote_type = ANY (ARRAY[1, -1]));

-- Recreate triggers
CREATE TRIGGER log_vote_activity_trigger
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION public.log_vote_activity();

CREATE TRIGGER refresh_rankings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_refresh_rankings();

-- Recreate the product rankings view
CREATE MATERIALIZED VIEW product_rankings AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.url_slug,
    p.image_url,
    p.created_at,
    COUNT(*) FILTER (WHERE v.vote_type = 1) as upvotes,
    COUNT(*) FILTER (WHERE v.vote_type = -1) as downvotes,
    COUNT(*) FILTER (WHERE v.vote_type = 1) - COUNT(*) FILTER (WHERE v.vote_type = -1) as score
FROM products p
LEFT JOIN votes v ON v.product_id = p.id
GROUP BY p.id, p.name, p.description, p.url_slug, p.image_url, p.created_at;

-- Recreate the category stats view
CREATE MATERIALIZED VIEW category_stats AS
SELECT 
    c.id,
    c.name,
    COUNT(DISTINCT p.id) as product_count,
    COUNT(*) FILTER (WHERE v.vote_type = 'up') as total_upvotes,
    COUNT(*) FILTER (WHERE v.vote_type = 'down') as total_downvotes
FROM categories c
LEFT JOIN product_categories pc ON pc.category_id = c.id
LEFT JOIN products p ON p.id = pc.product_id
LEFT JOIN votes v ON v.product_id = p.id
GROUP BY c.id, c.name;

-- Create indexes
CREATE UNIQUE INDEX ON product_rankings (id);
CREATE INDEX ON product_rankings (score DESC);
CREATE UNIQUE INDEX ON category_stats (id); 
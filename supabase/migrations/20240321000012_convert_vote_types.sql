-- Convert existing votes to new format
UPDATE public.votes
SET vote_type = CASE
    WHEN vote_type::text = '1' OR vote_type::text = 'upvote' THEN 'up'
    WHEN vote_type::text = '-1' OR vote_type::text = 'downvote' THEN 'down'
    ELSE vote_type::text
END
WHERE vote_type::text NOT IN ('up', 'down');

-- Refresh materialized views to reflect the changes
REFRESH MATERIALIZED VIEW CONCURRENTLY product_rankings; 
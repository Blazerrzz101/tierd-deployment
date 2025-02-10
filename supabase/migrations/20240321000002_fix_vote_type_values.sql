-- Fix vote_type values in votes table
ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;
ALTER TABLE votes ADD CONSTRAINT votes_vote_type_check CHECK (vote_type IN ('up', 'down'));

-- Update existing vote values
UPDATE votes SET vote_type = 'up' WHERE vote_type = 'upvote';
UPDATE votes SET vote_type = 'down' WHERE vote_type = 'downvote';

-- Fix vote_type values in product_votes table
ALTER TABLE product_votes DROP CONSTRAINT IF EXISTS product_votes_vote_type_check;
ALTER TABLE product_votes ADD CONSTRAINT product_votes_vote_type_check CHECK (vote_type IN ('up', 'down'));

-- Update existing product vote values
UPDATE product_votes SET vote_type = 'up' WHERE vote_type = 'upvote';
UPDATE product_votes SET vote_type = 'down' WHERE vote_type = 'downvote';

-- Fix any triggers or functions that reference vote types
CREATE OR REPLACE FUNCTION update_product_votes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO product_votes (product_id, user_id, vote_type)
    VALUES (NEW.product_id, NEW.user_id, 
        CASE 
            WHEN NEW.vote_type = 'upvote' THEN 'up'
            WHEN NEW.vote_type = 'downvote' THEN 'down'
            ELSE NEW.vote_type
        END);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql; 
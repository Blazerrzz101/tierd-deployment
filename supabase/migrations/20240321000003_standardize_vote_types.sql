-- Standardize vote types across all tables
DO $$ 
BEGIN
    -- 1. Update votes table
    ALTER TABLE votes DROP CONSTRAINT IF EXISTS votes_vote_type_check;
    UPDATE votes SET vote_type = 
        CASE 
            WHEN vote_type = 'upvote' THEN 'up'
            WHEN vote_type = 'downvote' THEN 'down'
            ELSE vote_type
        END;
    ALTER TABLE votes ADD CONSTRAINT votes_vote_type_check 
        CHECK (vote_type IN ('up', 'down'));

    -- 2. Update product_votes table
    ALTER TABLE product_votes DROP CONSTRAINT IF EXISTS product_votes_vote_type_check;
    UPDATE product_votes SET vote_type = 
        CASE 
            WHEN vote_type = 'upvote' THEN 'up'
            WHEN vote_type = 'downvote' THEN 'down'
            ELSE vote_type
        END;
    ALTER TABLE product_votes ADD CONSTRAINT product_votes_vote_type_check 
        CHECK (vote_type IN ('up', 'down'));

    -- 3. Update thread_votes table if it exists
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'thread_votes') THEN
        ALTER TABLE thread_votes DROP CONSTRAINT IF EXISTS thread_votes_vote_type_check;
        UPDATE thread_votes SET vote_type = 
            CASE 
                WHEN vote_type = 'upvote' THEN 'up'
                WHEN vote_type = 'downvote' THEN 'down'
                ELSE vote_type
            END;
        ALTER TABLE thread_votes ADD CONSTRAINT thread_votes_vote_type_check 
            CHECK (vote_type IN ('up', 'down'));
    END IF;

    -- 4. Update functions that handle votes
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

    -- 5. Update thread vote functions if they exist
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_thread_votes') THEN
        CREATE OR REPLACE FUNCTION update_thread_votes()
        RETURNS TRIGGER AS $$
        BEGIN
            UPDATE threads
            SET 
                upvotes = (
                    SELECT COUNT(*) FROM thread_votes
                    WHERE thread_id = NEW.thread_id AND vote_type = 'up'
                ),
                downvotes = (
                    SELECT COUNT(*) FROM thread_votes
                    WHERE thread_id = NEW.thread_id AND vote_type = 'down'
                )
            WHERE id = NEW.thread_id;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END $$; 
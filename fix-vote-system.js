// Script to fix vote function parameters
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The SQL that fixes the vote function parameters
const voteFunctionSQL = `
-- Fix the vote function to match client expectations
CREATE OR REPLACE FUNCTION public.vote_for_product(
    p_product_id uuid,
    p_vote_type integer,
    p_user_id uuid DEFAULT NULL,
    p_client_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_existing_vote record;
    v_result_vote_type integer;
    v_upvotes integer;
    v_downvotes integer;
    result jsonb;
BEGIN
    -- Validate vote type
    IF p_vote_type NOT IN (1, -1) THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid vote type. Must be either 1 or -1',
            'upvotes', 0,
            'downvotes', 0,
            'voteType', NULL
        );
    END IF;

    -- Make sure we have either a user ID or client ID
    IF p_user_id IS NULL AND p_client_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Must provide either user_id or client_id',
            'upvotes', 0,
            'downvotes', 0,
            'voteType', NULL
        );
    END IF;

    -- Check for existing vote by this user/client for this product
    SELECT id, vote_type INTO v_existing_vote
    FROM votes
    WHERE product_id = p_product_id
    AND (
        (user_id = p_user_id AND p_user_id IS NOT NULL)
        OR
        (user_id IS NULL AND metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
    );

    -- Handle the vote
    IF v_existing_vote IS NULL THEN
        -- Insert new vote
        INSERT INTO votes (product_id, user_id, vote_type, metadata)
        VALUES (
            p_product_id,
            p_user_id,
            p_vote_type,
            CASE 
                WHEN p_user_id IS NULL AND p_client_id IS NOT NULL THEN 
                    jsonb_build_object('client_id', p_client_id)
                ELSE '{}'::jsonb
            END
        );
        v_result_vote_type := p_vote_type;
    ELSIF v_existing_vote.vote_type = p_vote_type THEN
        -- Remove vote if same type (toggle behavior)
        DELETE FROM votes
        WHERE id = v_existing_vote.id;
        v_result_vote_type := NULL;
    ELSE
        -- Update vote type if different
        UPDATE votes
        SET vote_type = p_vote_type,
            updated_at = now()
        WHERE id = v_existing_vote.id;
        v_result_vote_type := p_vote_type;
    END IF;

    -- Count votes directly to avoid any potential issues
    SELECT 
        COALESCE(COUNT(*) FILTER (WHERE vote_type = 1), 0)::integer, 
        COALESCE(COUNT(*) FILTER (WHERE vote_type = -1), 0)::integer
    INTO v_upvotes, v_downvotes
    FROM votes
    WHERE product_id = p_product_id;

    -- Ensure values are integers
    v_upvotes := COALESCE(v_upvotes, 0)::integer;
    v_downvotes := COALESCE(v_downvotes, 0)::integer;

    -- Build result object with explicit integer casting to prevent NaN
    result := jsonb_build_object(
        'success', true,
        'message', CASE 
            WHEN v_result_vote_type IS NULL THEN 'Vote removed'
            WHEN v_result_vote_type = 1 THEN 'Upvoted successfully'
            ELSE 'Downvoted successfully'
        END,
        'voteType', v_result_vote_type,
        'upvotes', v_upvotes,
        'downvotes', v_downvotes,
        'score', (v_upvotes - v_downvotes)::integer
    );

    -- Update product score in database
    UPDATE products
    SET 
        upvotes = v_upvotes,
        downvotes = v_downvotes,
        score = (v_upvotes - v_downvotes)::integer,
        updated_at = now()
    WHERE id = p_product_id;

    RETURN result;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'An error occurred: ' || SQLERRM,
            'upvotes', 0,
            'downvotes', 0,
            'voteType', NULL
        );
END;
$$;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.vote_for_product(uuid, integer, uuid, text) TO authenticated, anon;

-- Also fix the has_user_voted function to match
CREATE OR REPLACE FUNCTION public.has_user_voted(
    p_product_id uuid,
    p_user_id uuid DEFAULT NULL,
    p_client_id text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
    v_vote_record record;
    result jsonb;
BEGIN
    -- Get vote if it exists
    SELECT id, vote_type INTO v_vote_record
    FROM votes
    WHERE product_id = p_product_id
    AND (
        (user_id = p_user_id AND p_user_id IS NOT NULL)
        OR
        (user_id IS NULL AND metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
    );
    
    -- Return result with explicit vote type
    RETURN jsonb_build_object(
        'has_voted', v_vote_record.id IS NOT NULL,
        'vote_type', v_vote_record.vote_type,
        'vote_id', v_vote_record.id
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'has_voted', false,
            'vote_type', NULL,
            'vote_id', NULL,
            'error', SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to all users
GRANT EXECUTE ON FUNCTION public.has_user_voted(uuid, uuid, text) TO authenticated, anon;
`;

async function fixVoteSystem() {
  console.log('Attempting to fix vote system functions...');
  
  // Try different methods to execute SQL on Supabase
  const methods = [
    // Method 1: Using the exec_sql function if it exists
    async () => {
      try {
        console.log('Trying with exec_sql function...');
        const { error } = await supabase.rpc('exec_sql', { sql: voteFunctionSQL });
        
        if (error) {
          console.error('Error with exec_sql function:', error);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Failed with exec_sql method:', error);
        return false;
      }
    },
    
    // Method 2: Using direct SQL endpoint if available
    async () => {
      try {
        console.log('Trying direct SQL endpoint...');
        const { error } = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql: voteFunctionSQL })
        }).then(res => res.json());
        
        if (error) {
          console.error('Error with direct SQL endpoint:', error);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Failed with direct SQL endpoint method:', error);
        return false;
      }
    },
    
    // Method 3: Using Supabase management API if available
    async () => {
      try {
        console.log('Trying Supabase management API...');
        const { error } = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/pg_dump`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
          },
          body: JSON.stringify({ sql: voteFunctionSQL })
        }).then(res => res.json());
        
        if (error) {
          console.error('Error with management API:', error);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Failed with management API method:', error);
        return false;
      }
    }
  ];
  
  // Try each method in sequence
  for (const method of methods) {
    const success = await method();
    if (success) {
      console.log('Successfully fixed vote functions!');
      return true;
    }
  }
  
  console.error('All methods failed to apply vote function fix.');
  return false;
}

// Run the fix if this file is executed directly
if (require.main === module) {
  fixVoteSystem()
    .then(success => {
      console.log(success ? 'Vote system fix completed successfully.' : 'Vote system fix failed.');
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { fixVoteSystem }; 
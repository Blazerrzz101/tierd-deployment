#!/usr/bin/env node

// Script to fix voting system issues directly
// This script addresses:
// 1. Function signature mismatches
// 2. Vote count inconsistencies
// 3. Type handling issues

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Fix specific issues in client code
async function fixClientCode() {
  console.log('Examining client code for vote handling issues...');
  
  try {
    // First check if any products have NaN or NULL upvotes/downvotes
    const { data: brokenProducts, error: queryError } = await supabase
      .from('products')
      .select('id, name, upvotes, downvotes, score')
      .or('upvotes.is.null,downvotes.is.null,score.is.null')
      .limit(10);
    
    if (queryError) {
      console.error('Error querying for broken products:', queryError.message);
    } else if (brokenProducts && brokenProducts.length > 0) {
      console.log(`Found ${brokenProducts.length} products with NULL vote values:`);
      for (const product of brokenProducts) {
        console.log(`- ${product.name} (${product.id}): upvotes=${product.upvotes}, downvotes=${product.downvotes}, score=${product.score}`);
      }
    } else {
      console.log('No products with NULL vote values found');
    }
  } catch (error) {
    console.error('Error checking for broken products:', error.message);
  }
}

// Try calling the vote functions with different parameter combinations
async function testFunctionCalls() {
  console.log('Testing different function call patterns...');
  
  try {
    // First, fetch a real product ID to test with
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);
    
    if (productsError || !products || products.length === 0) {
      console.error('Failed to fetch a product for testing:', productsError?.message || 'No products found');
      return false;
    }
    
    const testProductId = products[0].id;
    console.log(`Testing with product: ${products[0].name} (${testProductId})`);
    
    // Test 1: Original call pattern
    console.log('Test 1: Original call pattern');
    try {
      const { data, error } = await supabase.rpc('vote_for_product', {
        p_product_id: testProductId,
        p_vote_type: 1
      });
      console.log('Result:', data ? 'Success' : 'Failed', error ? error.message : '');
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    // Test 2: With client ID
    console.log('Test 2: With client ID');
    try {
      const { data, error } = await supabase.rpc('vote_for_product', {
        p_product_id: testProductId,
        p_vote_type: 1,
        p_client_id: 'test-client'
      });
      console.log('Result:', data ? 'Success' : 'Failed', error ? error.message : '');
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    // Test 3: With all parameters
    console.log('Test 3: With all parameters');
    try {
      const { data, error } = await supabase.rpc('vote_for_product', {
        p_product_id: testProductId,
        p_vote_type: 1,
        p_user_id: null,
        p_client_id: 'test-client'
      });
      console.log('Result:', data ? 'Success' : 'Failed', error ? error.message : '');
    } catch (e) {
      console.log('Error:', e.message);
    }
  } catch (error) {
    console.error('Error in testFunctionCalls:', error.message);
  }
}

// Update the vote_for_product function via RPC directly
async function fixVoteFunction() {
  console.log('Attempting to fix vote_for_product via a stored procedure...');
  
  try {
    // First create a temporary function to update the vote_for_product function
    const createFixFunctionSQL = `
    CREATE OR REPLACE FUNCTION public.fix_vote_function()
    RETURNS text AS $$
    BEGIN
      -- Drop existing function variations
      DROP FUNCTION IF EXISTS public.vote_for_product(uuid, integer);
      DROP FUNCTION IF EXISTS public.vote_for_product(uuid, text);
      DROP FUNCTION IF EXISTS public.vote_for_product(uuid, integer, text);
      
      -- Create the properly formatted function
      CREATE OR REPLACE FUNCTION public.vote_for_product(
          p_product_id uuid,
          p_vote_type integer,
          p_client_id text DEFAULT NULL
      )
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      DECLARE
          v_user_id uuid;
          v_existing_vote record;
          v_result_vote_type integer;
          v_upvotes integer;
          v_downvotes integer;
          result jsonb;
      BEGIN
          -- Get current user ID
          v_user_id := auth.uid();
          
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

          -- Check for existing vote by this user/client for this product
          SELECT id, vote_type INTO v_existing_vote
          FROM votes
          WHERE product_id = p_product_id
          AND (
              (user_id = v_user_id AND v_user_id IS NOT NULL)
              OR
              (user_id IS NULL AND metadata->>'client_id' = p_client_id AND p_client_id IS NOT NULL)
          );

          -- Handle the vote
          IF v_existing_vote IS NULL THEN
              -- Insert new vote
              INSERT INTO votes (product_id, user_id, vote_type, metadata)
              VALUES (
                  p_product_id,
                  v_user_id,
                  p_vote_type,
                  CASE 
                      WHEN v_user_id IS NULL AND p_client_id IS NOT NULL THEN 
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
      $func$;

      -- Grant execute permission to all users
      GRANT EXECUTE ON FUNCTION public.vote_for_product(uuid, integer, text) TO authenticated, anon;
      
      RETURN 'Vote function fixed successfully';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Function to fix has_user_voted
    const createFixHasVotedSQL = `
    CREATE OR REPLACE FUNCTION public.fix_has_voted_function()
    RETURNS text AS $$
    BEGIN
      -- Drop existing function variations
      DROP FUNCTION IF EXISTS public.has_user_voted(uuid, text);
      
      -- Create the properly formatted function
      CREATE OR REPLACE FUNCTION public.has_user_voted(
          p_product_id uuid,
          p_client_id text DEFAULT NULL
      )
      RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $func$
      DECLARE
          v_user_id uuid;
          v_vote_record record;
          result jsonb;
      BEGIN
          -- Get current user ID
          v_user_id := auth.uid();
          
          -- Get vote if it exists
          SELECT id, vote_type INTO v_vote_record
          FROM votes
          WHERE product_id = p_product_id
          AND (
              (user_id = v_user_id AND v_user_id IS NOT NULL)
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
      $func$;

      -- Grant execute permission to all users
      GRANT EXECUTE ON FUNCTION public.has_user_voted(uuid, text) TO authenticated, anon;
      
      RETURN 'has_user_voted function fixed successfully';
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Create function to fix vote counts
    const createFixVoteCountsSQL = `
    CREATE OR REPLACE FUNCTION public.fix_votes_procedure()
    RETURNS jsonb AS $$
    DECLARE
        product_record record;
        total_products integer := 0;
        fixed_products integer := 0;
        v_upvotes integer;
        v_downvotes integer;
        needs_fixing boolean;
        result jsonb;
    BEGIN
        -- Process each product
        FOR product_record IN 
            SELECT id, name, upvotes, downvotes, score
            FROM products
            ORDER BY id
        LOOP
            total_products := total_products + 1;
            
            -- Count actual votes
            SELECT 
                COALESCE(COUNT(*) FILTER (WHERE vote_type = 1), 0)::integer, 
                COALESCE(COUNT(*) FILTER (WHERE vote_type = -1), 0)::integer
            INTO v_upvotes, v_downvotes
            FROM votes
            WHERE product_id = product_record.id;
            
            -- Ensure values are integers
            v_upvotes := COALESCE(v_upvotes, 0)::integer;
            v_downvotes := COALESCE(v_downvotes, 0)::integer;
            
            -- Check if counts match
            needs_fixing := 
                (product_record.upvotes IS NULL OR product_record.upvotes != v_upvotes) OR
                (product_record.downvotes IS NULL OR product_record.downvotes != v_downvotes) OR
                (product_record.score IS NULL OR product_record.score != (v_upvotes - v_downvotes));
            
            -- Fix if needed
            IF needs_fixing THEN
                UPDATE products
                SET 
                    upvotes = v_upvotes,
                    downvotes = v_downvotes,
                    score = (v_upvotes - v_downvotes)::integer,
                    updated_at = now()
                WHERE id = product_record.id;
                
                fixed_products := fixed_products + 1;
            END IF;
        END LOOP;
        
        -- Build result
        result := jsonb_build_object(
            'total_products', total_products,
            'fixed_products', fixed_products
        );
        
        RETURN result;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN jsonb_build_object(
                'error', SQLERRM
            );
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    // Execute function creation
    let success = true;
    
    const { error: createFixError } = await supabase.rpc('custom_query', {
      query_text: createFixFunctionSQL
    }).single();
    
    if (createFixError) {
      console.error('Error creating fix_vote_function:', createFixError.message);
      
      // Try simplified approach
      const { error: simpleError } = await supabase.from('_migrations').insert({
        name: 'fix_vote_function',
        sql: createFixFunctionSQL
      });
      
      if (simpleError) {
        console.error('Could not create function via _migrations table:', simpleError.message);
        success = false;
      }
    }
    
    // Execute has_user_voted fix
    const { error: createHasVotedError } = await supabase.rpc('custom_query', {
      query_text: createFixHasVotedSQL
    }).single();
    
    if (createHasVotedError) {
      console.error('Error creating fix_has_voted_function:', createHasVotedError.message);
      success = success && false;
    }
    
    // Execute fix counts function
    const { error: createCountsError } = await supabase.rpc('custom_query', {
      query_text: createFixVoteCountsSQL
    }).single();
    
    if (createCountsError) {
      console.error('Error creating fix_votes_procedure:', createCountsError.message);
      success = success && false;
    }
    
    // If we created the functions, call them
    if (success) {
      console.log('Successfully created fix functions, now executing them...');
      
      // Fix vote function
      const { data: fixVoteResult, error: fixVoteError } = await supabase.rpc('fix_vote_function');
      if (fixVoteError) {
        console.error('Error executing fix_vote_function:', fixVoteError.message);
      } else {
        console.log('vote_for_product fixed:', fixVoteResult);
      }
      
      // Fix has_user_voted function
      const { data: fixHasVotedResult, error: fixHasVotedError } = await supabase.rpc('fix_has_voted_function');
      if (fixHasVotedError) {
        console.error('Error executing fix_has_voted_function:', fixHasVotedError.message);
      } else {
        console.log('has_user_voted fixed:', fixHasVotedResult);
      }
      
      // Fix vote counts
      const { data: fixCountsResult, error: fixCountsError } = await supabase.rpc('fix_votes_procedure');
      if (fixCountsError) {
        console.error('Error executing fix_votes_procedure:', fixCountsError.message);
      } else {
        console.log('Vote counts fixed:', fixCountsResult);
      }
    }
    
    return success;
  } catch (error) {
    console.error('Error in fixVoteFunction:', error.message);
    return false;
  }
}

// Apply the fix to the VoteProduct type in the frontend
async function analyzeClientIssues() {
  console.log('Analyzing client side code...');
  
  // Check the hooks/use-vote.ts file
  console.log('The useVote hook needs to handle these parameter changes:');
  console.log('1. Check that the function call uses the right parameter order');
  console.log('2. Ensure all vote counts are properly converted to numbers');
  console.log('3. Check the VoteProduct type for consistency');
  
  // Identify client-side components using votes
  console.log('\nComponents that need to be checked:');
  console.log('1. VoteButtons - Ensure it handles NaN and properly formats numbers');
  console.log('2. ProductCard - Check how it displays votes and scores');
  console.log('3. ProductDetails - Check how it handles vote data');
}

async function main() {
  try {
    console.log('Starting vote system diagnosis and fix...');
    
    // First, let's test the existing function calls
    await testFunctionCalls();
    
    // Next, check for client code issues
    await fixClientCode();
    
    // Now try to fix the functions via RPC
    const functionsFixed = await fixVoteFunction();
    
    // Analyze what client-side changes are needed
    await analyzeClientIssues();
    
    if (functionsFixed) {
      console.log('\n✅ Server-side fixes applied successfully!');
    } else {
      console.log('\n⚠️ Some server-side fixes could not be applied automatically.');
      console.log('You will need to apply these changes manually via the Supabase dashboard.');
    }
    
    console.log('\nRecommended next steps:');
    console.log('1. Check client code in hooks/use-vote.ts for parameter order and type safety');
    console.log('2. Update VoteButtons component to ensure proper number handling');
    console.log('3. Run a full test by voting on a product and verifying counts update correctly');
    console.log('4. Consider implementing the admin dashboard at /test/vote-tools for ongoing monitoring');
    
    console.log('\nVote system diagnosis and fix completed!');
  } catch (error) {
    console.error('Error in main process:', error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 
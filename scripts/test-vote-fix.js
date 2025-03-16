#!/usr/bin/env node

// Script to test vote functionality
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Using anon key to simulate frontend

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env');
  process.exit(1);
}

// Create Supabase client
console.log('Creating Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Ensure a value is a number
const ensureNumber = (value) => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Get a random client ID
const clientId = `test-client-${Math.random().toString(36).substring(2)}_${Date.now()}`;

async function main() {
  try {
    console.log(`Starting vote functionality test with client ID: ${clientId}`);
    
    // Step 1: Get a product to test with
    console.log('\n1. Fetching a product to test with...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, upvotes, downvotes')
      .limit(1);
    
    if (productsError) {
      throw new Error(`Error fetching products: ${productsError.message}`);
    }
    
    if (!products || products.length === 0) {
      throw new Error('No products found to test with');
    }
    
    const product = products[0];
    console.log(`Using product: ${product.name} (${product.id})`);
    console.log(`Initial vote counts: Upvotes=${ensureNumber(product.upvotes)}, Downvotes=${ensureNumber(product.downvotes)}`);
    
    // Step 2: Check if we have voted before (should be no)
    console.log('\n2. Checking if we have voted before...');
    const { data: initialVoteCheck, error: initialCheckError } = await supabase.rpc('has_user_voted', {
      p_product_id: product.id,
      p_client_id: clientId
    });
    
    if (initialCheckError) {
      console.error(`Error checking initial vote status: ${initialCheckError.message}`);
      console.log('This likely indicates an issue with the has_user_voted function signature');
      // Try alternative parameter orders
      console.log('Trying alternative parameter orders...');
      
      try {
        const { data: altCheck1 } = await supabase.rpc('has_user_voted', {
          p_product_id: product.id,
          p_client_id: clientId
        });
        console.log('Alternative 1 worked');
      } catch (e) {
        console.error('Alternative 1 failed:', e.message);
      }
      
      try {
        const { data: altCheck2 } = await supabase.rpc('has_user_voted', {
          p_product_id: product.id,
          user_id: null,
          p_client_id: clientId
        });
        console.log('Alternative 2 worked');
      } catch (e) {
        console.error('Alternative 2 failed:', e.message);
      }
    } else {
      console.log('Vote check successful:', initialVoteCheck);
      console.log(`Has voted: ${initialVoteCheck.has_voted ? 'Yes' : 'No'}`);
      console.log(`Current vote type: ${initialVoteCheck.vote_type || 'None'}`);
    }
    
    // Step 3: Cast an upvote
    console.log('\n3. Casting an upvote...');
    const { data: upvoteResult, error: upvoteError } = await supabase.rpc('vote_for_product', {
      p_product_id: product.id,
      p_vote_type: 1,
      p_client_id: clientId
    });
    
    if (upvoteError) {
      console.error(`Error casting upvote: ${upvoteError.message}`);
      console.log('This likely indicates an issue with the vote_for_product function signature');
      // Try alternative parameter orders
      console.log('Trying alternative parameter orders...');
      
      try {
        const { data: altVote1 } = await supabase.rpc('vote_for_product', {
          p_product_id: product.id,
          p_vote_type: 1,
          p_client_id: clientId
        });
        console.log('Alternative 1 worked:', altVote1);
      } catch (e) {
        console.error('Alternative 1 failed:', e.message);
      }
      
      try {
        const { data: altVote2 } = await supabase.rpc('vote_for_product', {
          p_product_id: product.id,
          p_vote_type: 1,
          user_id: null,
          p_client_id: clientId
        });
        console.log('Alternative 2 worked:', altVote2);
      } catch (e) {
        console.error('Alternative 2 failed:', e.message);
      }
    } else {
      console.log('Upvote successful:', upvoteResult);
      console.log(`New vote counts: Upvotes=${ensureNumber(upvoteResult.upvotes)}, Downvotes=${ensureNumber(upvoteResult.downvotes)}`);
      
      // Check for potential NaN issues
      if (isNaN(upvoteResult.upvotes) || isNaN(upvoteResult.downvotes)) {
        console.error('\nNaN issue detected! This confirms part of the problem.');
        console.log('The database function is returning non-numeric values for vote counts.');
      }
    }
    
    // Step 4: Check vote state again (should be upvoted)
    console.log('\n4. Checking vote state after upvoting...');
    const { data: midVoteCheck, error: midCheckError } = await supabase.rpc('has_user_voted', {
      p_product_id: product.id,
      p_client_id: clientId
    });
    
    if (midCheckError) {
      console.error(`Error checking mid vote status: ${midCheckError.message}`);
    } else {
      console.log('Vote check successful:', midVoteCheck);
      console.log(`Has voted: ${midVoteCheck.has_voted ? 'Yes' : 'No'}`);
      console.log(`Current vote type: ${midVoteCheck.vote_type || 'None'}`);
    }
    
    // Step 5: Change to a downvote
    console.log('\n5. Changing to a downvote...');
    const { data: downvoteResult, error: downvoteError } = await supabase.rpc('vote_for_product', {
      p_product_id: product.id,
      p_vote_type: -1,
      p_client_id: clientId
    });
    
    if (downvoteError) {
      console.error(`Error casting downvote: ${downvoteError.message}`);
    } else {
      console.log('Downvote successful:', downvoteResult);
      console.log(`New vote counts: Upvotes=${ensureNumber(downvoteResult.upvotes)}, Downvotes=${ensureNumber(downvoteResult.downvotes)}`);
    }
    
    // Step 6: Remove the vote
    console.log('\n6. Removing the vote...');
    const { data: removeVoteResult, error: removeVoteError } = await supabase.rpc('vote_for_product', {
      p_product_id: product.id,
      p_vote_type: -1, // Same as current to toggle off
      p_client_id: clientId
    });
    
    if (removeVoteError) {
      console.error(`Error removing vote: ${removeVoteError.message}`);
    } else {
      console.log('Vote removal successful:', removeVoteResult);
      console.log(`Final vote counts: Upvotes=${ensureNumber(removeVoteResult.upvotes)}, Downvotes=${ensureNumber(removeVoteResult.downvotes)}`);
    }
    
    // Step 7: Final vote check
    console.log('\n7. Final vote check...');
    const { data: finalVoteCheck, error: finalCheckError } = await supabase.rpc('has_user_voted', {
      p_product_id: product.id,
      p_client_id: clientId
    });
    
    if (finalCheckError) {
      console.error(`Error checking final vote status: ${finalCheckError.message}`);
    } else {
      console.log('Final vote check successful:', finalVoteCheck);
      console.log(`Has voted: ${finalVoteCheck.has_voted ? 'Yes' : 'No'}`);
      console.log(`Final vote type: ${finalVoteCheck.vote_type || 'None'}`);
    }
    
    // Summary
    console.log('\n=== Test Summary ===');
    
    // Check for issues
    const hasIssues = 
      !!initialCheckError || 
      !!upvoteError || 
      !!midCheckError || 
      !!downvoteError || 
      !!removeVoteError || 
      !!finalCheckError;
    
    if (hasIssues) {
      console.log('⚠️ Test completed with ISSUES');
      console.log('The vote functions have signature or implementation problems that need fixing.');
      console.log('\nRecommended Actions:');
      console.log('1. Update the database functions using the SQL scripts provided');
      console.log('2. Ensure client code handles potential function signature mismatches');
      console.log('3. Add proper type safety for vote counts');
    } else {
      console.log('✅ Test completed successfully!');
      console.log('The vote functions appear to be working correctly with our client code fixes.');
      console.log('\nRecommended Actions:');
      console.log('1. Ensure all components properly format numbers using ensureNumber()');
      console.log('2. Consider running the fix-all-counts procedure to update any inconsistent votes');
    }
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the main function
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 
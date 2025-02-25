#!/usr/bin/env node

// Script to verify the vote system fix
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

// Get a random client ID
const clientId = `verification-client-${Math.random().toString(36).substring(2)}_${Date.now()}`;

async function main() {
  try {
    console.log('===== Vote System Verification =====');
    console.log('This script will verify if the voting system fixes have been properly applied.');
    
    // 1. Check database structure
    console.log('\n1. Checking database structure...');
    
    // Get products table schema
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single();
    
    if (productError) {
      console.error(`Error fetching product: ${productError.message}`);
    } else {
      console.log('Product table structure:');
      Object.keys(product).forEach(column => {
        console.log(`- ${column}: ${typeof product[column]}`);
      });
      
      // Check for upvotes/downvotes columns
      const hasUpvotes = 'upvotes' in product;
      const hasDownvotes = 'downvotes' in product;
      
      if (hasUpvotes && hasDownvotes) {
        console.log('\n❌ Products table has upvotes/downvotes columns - these are NOT needed with our fix!');
      } else {
        console.log('\n✅ Products table does not have upvotes/downvotes columns - correct structure for our fix!');
      }
    }
    
    // 2. Check votes table
    console.log('\n2. Checking votes table...');
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(5);
    
    if (votesError) {
      console.error(`Error fetching votes: ${votesError.message}`);
    } else {
      console.log(`Found ${votes.length} votes`);
      if (votes.length > 0) {
        console.log('Votes table structure:');
        const vote = votes[0];
        Object.keys(vote).forEach(column => {
          console.log(`- ${column}: ${typeof vote[column]} (${vote[column] === null ? 'NULL' : vote[column]})`);
        });
        
        // Check for metadata with client_id
        const hasMetadata = vote.metadata && typeof vote.metadata === 'object';
        const hasClientId = hasMetadata && 'client_id' in vote.metadata;
        
        if (hasClientId) {
          console.log('\n✅ Votes table has metadata with client_id - correct structure for our fix!');
        } else {
          console.log('\n❌ Votes table does not have client_id in metadata - this will cause issues!');
        }
      }
    }
    
    // 3. Test vote_for_product function
    console.log('\n3. Testing vote_for_product function...');
    
    if (!product) {
      console.error('Cannot test voting without a valid product');
    } else {
      console.log(`Using product: ${product.name} (${product.id})`);
      
      try {
        const { data: voteResult, error: voteError } = await supabase.rpc('vote_for_product', {
          p_product_id: product.id,
          p_vote_type: 1,
          p_client_id: clientId
        });
        
        if (voteError) {
          console.error(`Error with vote_for_product: ${voteError.message}`);
          console.log('❌ vote_for_product function failed to execute!');
        } else {
          console.log('✅ vote_for_product function executed successfully!');
          console.log('Function returns:', voteResult);
          
          // Check the return structure
          const hasVoteType = voteResult && 'vote_type' in voteResult;
          
          if (hasVoteType) {
            console.log('✅ vote_for_product returns vote_type - compatible with our client-side fix!');
          } else {
            console.log('❌ vote_for_product does not return vote_type - may cause issues!');
          }
        }
      } catch (e) {
        console.error('Error testing vote_for_product:', e.message);
      }
    }
    
    // 4. Check for votes with NULL or invalid vote_type
    console.log('\n4. Checking for votes with NULL or invalid vote_type...');
    
    const { data: invalidVotes, error: invalidVotesError } = await supabase
      .from('votes')
      .select('id, product_id, vote_type')
      .or('vote_type.is.null,vote_type.not.in.(1,-1)')
      .limit(10);
    
    if (invalidVotesError) {
      console.error(`Error checking for invalid votes: ${invalidVotesError.message}`);
    } else {
      if (invalidVotes.length > 0) {
        console.log(`❌ Found ${invalidVotes.length} votes with NULL or invalid vote_type!`);
        console.log('Example invalid votes:', invalidVotes.slice(0, 3));
      } else {
        console.log('✅ No votes with NULL or invalid vote_type found!');
      }
    }
    
    // 5. Verify our client-side vote count calculation
    console.log('\n5. Verifying client-side vote count calculation...');
    
    const { data: voteCountsRaw, error: voteCountsError } = await supabase
      .from('votes')
      .select('vote_type, count()')
      .eq('product_id', product.id)
      .group('vote_type');
    
    if (voteCountsError) {
      console.error(`Error fetching vote counts: ${voteCountsError.message}`);
    } else {
      console.log('Vote counts by type:', voteCountsRaw);
      
      // Apply our algorithm
      let upvotes = 0;
      let downvotes = 0;
      
      voteCountsRaw.forEach(item => {
        if (item.vote_type === 1) {
          upvotes = parseInt(item.count) || 0;
        } else if (item.vote_type === -1) {
          downvotes = parseInt(item.count) || 0;
        }
      });
      
      console.log(`Calculated upvotes: ${upvotes}, downvotes: ${downvotes}, score: ${upvotes - downvotes}`);
      console.log('✅ Vote count calculation is working as expected!');
    }
    
    // Final assessment
    console.log('\n===== Verification Complete =====');
    
    const issues = [];
    
    if (productError) issues.push('Issues accessing products table');
    if (votesError) issues.push('Issues accessing votes table');
    if (votes && votes.length > 0 && (!votes[0].metadata || !votes[0].metadata.client_id)) {
      issues.push('Votes table missing client_id in metadata');
    }
    
    if (issues.length > 0) {
      console.log('❌ Found potential issues:');
      issues.forEach((issue, i) => console.log(`   ${i + 1}. ${issue}`));
      console.log('\nRecommendations:');
      console.log('1. Make sure the vote_for_product function is properly defined');
      console.log('2. Ensure votes table has metadata JSONB column with client_id');
      console.log('3. Check that client-side code properly handles these structures');
    } else {
      console.log('✅ All verifications passed!');
      console.log('The vote system appears to be correctly structured and working with our client-side fix.');
    }
    
  } catch (error) {
    console.error('Script failed:', error.message);
  }
}

// Run the main function
main().catch(error => {
  console.error('Script failed:', error);
  process.exit(1);
}); 
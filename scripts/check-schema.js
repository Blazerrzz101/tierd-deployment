#!/usr/bin/env node

// Script to check database schema
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

async function main() {
  try {
    console.log('Checking database schema...');
    
    // Get products table schema
    console.log('\n1. Checking products table columns...');
    const { data: columns, error: columnsError } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (columnsError) {
      console.error(`Error fetching products: ${columnsError.message}`);
    } else if (columns && columns.length > 0) {
      console.log('Products table columns:');
      const product = columns[0];
      Object.keys(product).forEach(column => {
        console.log(`- ${column}: ${typeof product[column]} (${product[column] === null ? 'NULL' : product[column]})`);
      });
    } else {
      console.log('No products found');
    }
    
    // Check vote-related functions
    console.log('\n2. Checking if vote functions exist...');
    
    try {
      console.log('Testing vote_for_product function...');
      const productId = columns && columns.length > 0 ? columns[0].id : '00000000-0000-0000-0000-000000000001';
      const { data: voteResult, error: voteError } = await supabase.rpc('vote_for_product', {
        p_product_id: productId,
        p_vote_type: 1,
        p_client_id: 'schema-test-client'
      });
      
      if (voteError) {
        console.error(`Error with vote_for_product: ${voteError.message}`);
        
        // Try another parameter combination
        console.log('Trying alternative parameter format...');
        const { data: altVoteResult, error: altVoteError } = await supabase.rpc('vote_for_product', {
          product_id: productId,
          vote_type: 1,
          client_id: 'schema-test-client'
        });
        
        if (altVoteError) {
          console.error(`Alternative format also failed: ${altVoteError.message}`);
        } else {
          console.log('Alternative format worked!');
          console.log('Function returns:', altVoteResult);
        }
      } else {
        console.log('vote_for_product function exists and works!');
        console.log('Function returns:', voteResult);
      }
    } catch (e) {
      console.error('Error testing vote_for_product:', e.message);
    }
    
    try {
      console.log('\nTesting has_user_voted function...');
      const productId = columns && columns.length > 0 ? columns[0].id : '00000000-0000-0000-0000-000000000001';
      const { data: checkResult, error: checkError } = await supabase.rpc('has_user_voted', {
        p_product_id: productId,
        p_client_id: 'schema-test-client'
      });
      
      if (checkError) {
        console.error(`Error with has_user_voted: ${checkError.message}`);
        
        // Try another parameter combination
        console.log('Trying alternative parameter format...');
        const { data: altCheckResult, error: altCheckError } = await supabase.rpc('has_user_voted', {
          product_id: productId,
          client_id: 'schema-test-client'
        });
        
        if (altCheckError) {
          console.error(`Alternative format also failed: ${altCheckError.message}`);
        } else {
          console.log('Alternative format worked!');
          console.log('Function returns:', altCheckResult);
        }
      } else {
        console.log('has_user_voted function exists and works!');
        console.log('Function returns:', checkResult);
      }
    } catch (e) {
      console.error('Error testing has_user_voted:', e.message);
    }
    
    // Check votes table
    console.log('\n3. Checking votes table...');
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(5);
    
    if (votesError) {
      console.error(`Error fetching votes: ${votesError.message}`);
    } else {
      console.log(`Found ${votes.length} votes`);
      if (votes.length > 0) {
        console.log('Votes table columns:');
        const vote = votes[0];
        Object.keys(vote).forEach(column => {
          console.log(`- ${column}: ${typeof vote[column]} (${vote[column] === null ? 'NULL' : vote[column]})`);
        });
      }
    }
    
    console.log('\n=== Schema Check Summary ===');
    if (columnsError || votesError) {
      console.log('⚠️ Schema check completed with ISSUES');
    } else {
      console.log('✅ Schema check completed!');
      console.log('Based on the results above, you should adjust your code to match the actual schema.');
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
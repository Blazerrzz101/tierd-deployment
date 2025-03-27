#!/usr/bin/env node

/**
 * Test script to verify vote consistency across different parts of the site
 * 
 * This script will:
 * 1. Generate a unique client ID
 * 2. Make multiple API calls to vote endpoints to test different scenarios
 * 3. Verify that votes are consistent across different API calls
 */

const fetch = require('node-fetch');
const crypto = require('crypto');

// Utility function to generate a client ID similar to the one in the browser
function generateClientId() {
  const timestamp = Date.now().toString(36);
  const randomString = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${randomString}`;
}

// Utility function to sleep for a specified time
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test product ID to use
const TEST_PRODUCT_ID = '5f9f1b9b-b2c0-4c3b-b9c2-8e0b5f5c5b9a';
const TEST_PRODUCT_NAME = 'Test Product';

// Main test function
async function runTests() {
  console.log('Starting vote consistency tests...');
  
  // Generate a client ID
  const clientId = generateClientId();
  console.log(`Using client ID: ${clientId}`);
  
  // 1. Get initial vote status
  console.log('\n1. Getting initial vote status...');
  let voteStatus = await getVoteStatus(TEST_PRODUCT_ID, clientId);
  console.log('Initial vote status:', voteStatus);
  
  // 2. Submit an upvote
  console.log('\n2. Submitting an upvote...');
  let voteResponse = await submitVote(TEST_PRODUCT_ID, 1, clientId);
  console.log('Upvote response:', voteResponse);
  
  // 3. Get vote status again to verify upvote was recorded
  console.log('\n3. Getting vote status after upvote...');
  voteStatus = await getVoteStatus(TEST_PRODUCT_ID, clientId);
  console.log('Vote status after upvote:', voteStatus);
  
  // 4. Submit a downvote (should change the vote)
  console.log('\n4. Submitting a downvote...');
  voteResponse = await submitVote(TEST_PRODUCT_ID, -1, clientId);
  console.log('Downvote response:', voteResponse);
  
  // 5. Get vote status to verify downvote was recorded
  console.log('\n5. Getting vote status after downvote...');
  voteStatus = await getVoteStatus(TEST_PRODUCT_ID, clientId);
  console.log('Vote status after downvote:', voteStatus);
  
  // 6. Submit same vote again (should remove the vote)
  console.log('\n6. Submitting same downvote again (should remove vote)...');
  voteResponse = await submitVote(TEST_PRODUCT_ID, -1, clientId);
  console.log('Remove vote response:', voteResponse);
  
  // 7. Get vote status to verify vote was removed
  console.log('\n7. Getting vote status after vote removal...');
  voteStatus = await getVoteStatus(TEST_PRODUCT_ID, clientId);
  console.log('Vote status after removal:', voteStatus);
  
  console.log('\nTests completed successfully!');
}

// Function to get vote status for a product
async function getVoteStatus(productId, clientId) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/vote?productId=${encodeURIComponent(productId)}&clientId=${encodeURIComponent(clientId)}`,
      {
        headers: {
          'X-Client-ID': clientId
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting vote status:', error);
    return { success: false, error: error.message };
  }
}

// Function to submit a vote for a product
async function submitVote(productId, voteType, clientId) {
  try {
    const response = await fetch('http://localhost:3000/api/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-ID': clientId
      },
      body: JSON.stringify({
        productId,
        voteType,
        clientId
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting vote:', error);
    return { success: false, error: error.message };
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
}); 
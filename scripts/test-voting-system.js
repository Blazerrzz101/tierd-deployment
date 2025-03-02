#!/usr/bin/env node

/**
 * Comprehensive Voting System Test
 * 
 * This script tests all major functionality of the voting system:
 * - Upvoting
 * - Downvoting
 * - Vote toggling
 * - Vote changing
 * - Rate limiting
 * - Vote status checking
 */

const fetch = require('node-fetch');
const readline = require('readline');

// Configuration
const BASE_URL = 'http://localhost:3001';
const TEST_PRODUCTS = [
  { id: '9dd2bfe2-6eef-40de-ae12-c35ff1975914', name: 'Logitech G502 HERO' },
  { id: 'f6d6c64f-6e5b-4836-b832-e9a8a8a8f3d5', name: 'Razer DeathAdder V2' },
];
const TEST_CLIENT_ID = 'test-client-' + Math.random().toString(36).substring(2, 10);

// Create console interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper for colorized console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Helper for making API requests
async function apiRequest(endpoint, method = 'GET', body = undefined) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`${colors.red}API Error:${colors.reset}`, error.message);
    return { success: false, error: error.message };
  }
}

// Test functions
async function checkVoteStatus(productId) {
  console.log(`\n${colors.cyan}Checking vote status for product: ${productId}${colors.reset}`);
  const response = await apiRequest(`/api/vote?productId=${productId}&clientId=${TEST_CLIENT_ID}`);
  console.log(colors.yellow, 'Vote Status Response:', colors.reset);
  console.log(JSON.stringify(response, null, 2));
  return response;
}

async function submitVote(productId, voteType) {
  const voteTypeText = voteType === 1 ? 'upvote' : 'downvote';
  console.log(`\n${colors.cyan}Submitting ${voteTypeText} for product: ${productId}${colors.reset}`);
  
  const response = await apiRequest('/api/vote', 'POST', {
    productId,
    voteType,
    clientId: TEST_CLIENT_ID
  });
  
  console.log(colors.yellow, 'Vote Submission Response:', colors.reset);
  console.log(JSON.stringify(response, null, 2));
  return response;
}

async function checkRemainingVotes() {
  console.log(`\n${colors.cyan}Checking remaining votes for client: ${TEST_CLIENT_ID}${colors.reset}`);
  const response = await apiRequest(`/api/vote/remaining-votes?clientId=${TEST_CLIENT_ID}`);
  console.log(colors.yellow, 'Remaining Votes Response:', colors.reset);
  console.log(JSON.stringify(response, null, 2));
  return response;
}

// Test scenarios
async function runTests() {
  try {
    console.log(`${colors.magenta}================================${colors.reset}`);
    console.log(`${colors.magenta}  VOTING SYSTEM TEST SUITE      ${colors.reset}`);
    console.log(`${colors.magenta}  Client ID: ${TEST_CLIENT_ID}  ${colors.reset}`);
    console.log(`${colors.magenta}================================${colors.reset}`);

    const product = TEST_PRODUCTS[0];
    console.log(`\nTesting with product: ${colors.green}${product.name}${colors.reset} (${product.id})`);

    // Test 1: Check initial vote status
    console.log(`\n${colors.blue}TEST 1: Initial Vote Status${colors.reset}`);
    const initialStatus = await checkVoteStatus(product.id);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 2: Submit an upvote
    console.log(`\n${colors.blue}TEST 2: Submit Upvote${colors.reset}`);
    const upvoteResult = await submitVote(product.id, 1);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Check vote status after upvote
    console.log(`\n${colors.blue}TEST 3: Vote Status After Upvote${colors.reset}`);
    const statusAfterUpvote = await checkVoteStatus(product.id);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 4: Toggle upvote (submit upvote again)
    console.log(`\n${colors.blue}TEST 4: Toggle Upvote${colors.reset}`);
    const toggleUpvoteResult = await submitVote(product.id, 1);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 5: Check vote status after toggle
    console.log(`\n${colors.blue}TEST 5: Vote Status After Toggle${colors.reset}`);
    const statusAfterToggle = await checkVoteStatus(product.id);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 6: Submit a downvote
    console.log(`\n${colors.blue}TEST 6: Submit Downvote${colors.reset}`);
    const downvoteResult = await submitVote(product.id, -1);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 7: Check vote status after downvote
    console.log(`\n${colors.blue}TEST 7: Vote Status After Downvote${colors.reset}`);
    const statusAfterDownvote = await checkVoteStatus(product.id);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test 8: Check remaining votes
    console.log(`\n${colors.blue}TEST 8: Check Remaining Votes${colors.reset}`);
    const remainingVotes = await checkRemainingVotes();

    // Test summary
    console.log(`\n${colors.magenta}================================${colors.reset}`);
    console.log(`${colors.magenta}        TEST SUMMARY            ${colors.reset}`);
    console.log(`${colors.magenta}================================${colors.reset}`);
    
    console.log(`\n${colors.cyan}Initial Status:${colors.reset}`);
    console.log(`- Upvotes: ${initialStatus.upvotes || 0}`);
    console.log(`- Downvotes: ${initialStatus.downvotes || 0}`);
    console.log(`- User Vote: ${initialStatus.voteType === null ? 'None' : initialStatus.voteType}`);
    
    console.log(`\n${colors.cyan}After Upvote:${colors.reset}`);
    console.log(`- Success: ${upvoteResult.success ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`);
    console.log(`- Upvotes: ${statusAfterUpvote.upvotes}`);
    console.log(`- Downvotes: ${statusAfterUpvote.downvotes}`);
    console.log(`- User Vote: ${statusAfterUpvote.voteType}`);
    
    console.log(`\n${colors.cyan}After Toggle:${colors.reset}`);
    console.log(`- Success: ${toggleUpvoteResult.success ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`);
    console.log(`- Upvotes: ${statusAfterToggle.upvotes}`);
    console.log(`- Downvotes: ${statusAfterToggle.downvotes}`);
    console.log(`- User Vote: ${statusAfterToggle.voteType === null ? 'None' : statusAfterToggle.voteType}`);
    
    console.log(`\n${colors.cyan}After Downvote:${colors.reset}`);
    console.log(`- Success: ${downvoteResult.success ? colors.green + 'Yes' + colors.reset : colors.red + 'No' + colors.reset}`);
    console.log(`- Upvotes: ${statusAfterDownvote.upvotes}`);
    console.log(`- Downvotes: ${statusAfterDownvote.downvotes}`);
    console.log(`- User Vote: ${statusAfterDownvote.voteType}`);
    
    console.log(`\n${colors.cyan}Remaining Votes:${colors.reset}`);
    console.log(`- Remaining: ${remainingVotes.remainingVotes}`);
    console.log(`- Maximum: ${remainingVotes.maxVotes}`);
    console.log(`- Used: ${remainingVotes.votesUsed}`);

    // Overall assessment
    console.log(`\n${colors.magenta}VERDICT:${colors.reset}`);
    const allSuccessful = 
      upvoteResult.success && 
      toggleUpvoteResult.success && 
      downvoteResult.success &&
      remainingVotes.success;
    
    if (allSuccessful) {
      console.log(`${colors.green}All tests passed successfully! The voting system is working as expected.${colors.reset}`);
    } else {
      console.log(`${colors.red}Some tests failed. Please check the detailed results above.${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Error running tests:${colors.reset}`, error);
  } finally {
    rl.close();
  }
}

// Check if server is running before starting tests
async function checkServerAndRunTests() {
  try {
    console.log('Checking if server is running...');
    const response = await fetch(`${BASE_URL}/api/health-check`).catch(() => ({ ok: false }));
    
    if (!response.ok) {
      console.log(`${colors.yellow}Warning: Could not connect to server at ${BASE_URL}${colors.reset}`);
      rl.question(`${colors.yellow}Do you want to continue with the tests anyway? (y/n) ${colors.reset}`, (answer) => {
        if (answer.toLowerCase() === 'y') {
          runTests();
        } else {
          console.log('Tests cancelled. Please start the server and try again.');
          rl.close();
        }
      });
    } else {
      runTests();
    }
  } catch (error) {
    console.error(`${colors.red}Error checking server:${colors.reset}`, error);
    rl.question(`${colors.yellow}Server check failed. Continue anyway? (y/n) ${colors.reset}`, (answer) => {
      if (answer.toLowerCase() === 'y') {
        runTests();
      } else {
        console.log('Tests cancelled.');
        rl.close();
      }
    });
  }
}

// Start the tests
checkServerAndRunTests(); 
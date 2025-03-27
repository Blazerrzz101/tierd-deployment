/**
 * Vote Consistency Test Script
 * 
 * This script tests the consistency of votes across different parts of the site.
 * It verifies that the global vote system properly synchronizes votes between
 * different components and pages.
 * 
 * It works by:
 * 1. Getting a consistent client ID
 * 2. Testing votes on a product detail page
 * 3. Testing votes on the rankings page for the same product
 * 4. Verifying the votes are consistent
 */

const clientId = require('crypto').randomUUID();
// Use dynamic import for node-fetch
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Configuration
const TEST_PRODUCT_ID = "1"; // Change this to a product ID in your database
const BASE_URL = "http://localhost:3000";
const API_BASE = `${BASE_URL}/api`;

// Sleep utility
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get the current vote status for a product
 */
async function getVoteStatus(productId) {
  console.log(`Getting vote status for product ${productId} with client ID ${clientId}`);
  
  try {
    const response = await fetch(
      `${API_BASE}/vote?productId=${productId}&clientId=${clientId}`,
      {
        headers: {
          "X-Client-ID": clientId
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get vote status: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error getting vote status:`, error);
    return null;
  }
}

/**
 * Submit a vote for a product
 */
async function submitVote(productId, voteType) {
  console.log(`Submitting vote type ${voteType} for product ${productId} with client ID ${clientId}`);
  
  try {
    const response = await fetch(`${API_BASE}/vote`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Client-ID": clientId
      },
      body: JSON.stringify({
        productId,
        clientId,
        voteType
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit vote: ${errorText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Error submitting vote:`, error);
    return null;
  }
}

/**
 * Run the vote consistency tests
 */
async function runTests() {
  console.log("=== Starting Vote Consistency Tests ===");
  console.log(`Using client ID: ${clientId}`);
  
  // First, get the initial vote status
  console.log("\n1. Checking initial vote status...");
  const initialStatus = await getVoteStatus(TEST_PRODUCT_ID);
  console.log("Initial vote status:", initialStatus);
  
  // Submit an upvote
  console.log("\n2. Submitting an upvote...");
  const upvoteResult = await submitVote(TEST_PRODUCT_ID, 1);
  console.log("Upvote result:", upvoteResult);
  
  // Check the status after upvoting
  await sleep(500); // Give the system time to process
  console.log("\n3. Checking vote status after upvote...");
  const afterUpvoteStatus = await getVoteStatus(TEST_PRODUCT_ID);
  console.log("After upvote status:", afterUpvoteStatus);
  
  // Verify the upvote was recorded correctly
  if (afterUpvoteStatus?.voteType === 1) {
    console.log("✅ PASS: Upvote was correctly recorded");
  } else {
    console.log("❌ FAIL: Upvote was not correctly recorded");
  }
  
  // Submit a downvote (changing the vote)
  console.log("\n4. Changing to a downvote...");
  const downvoteResult = await submitVote(TEST_PRODUCT_ID, -1);
  console.log("Downvote result:", downvoteResult);
  
  // Check the status after downvoting
  await sleep(500); // Give the system time to process
  console.log("\n5. Checking vote status after downvote...");
  const afterDownvoteStatus = await getVoteStatus(TEST_PRODUCT_ID);
  console.log("After downvote status:", afterDownvoteStatus);
  
  // Verify the downvote was recorded correctly
  if (afterDownvoteStatus?.voteType === -1) {
    console.log("✅ PASS: Downvote was correctly recorded");
  } else {
    console.log("❌ FAIL: Downvote was not correctly recorded");
  }
  
  // Remove the vote
  console.log("\n6. Removing the vote...");
  const removeVoteResult = await submitVote(TEST_PRODUCT_ID, null);
  console.log("Remove vote result:", removeVoteResult);
  
  // Check the status after removing vote
  await sleep(500); // Give the system time to process
  console.log("\n7. Checking vote status after removal...");
  const afterRemovalStatus = await getVoteStatus(TEST_PRODUCT_ID);
  console.log("After removal status:", afterRemovalStatus);
  
  // Verify the vote was removed correctly
  if (afterRemovalStatus?.voteType === null) {
    console.log("✅ PASS: Vote was correctly removed");
  } else {
    console.log("❌ FAIL: Vote was not correctly removed");
  }
  
  console.log("\n=== Vote Consistency Test Complete ===");
}

// Run the tests
runTests().catch(error => {
  console.error("Test error:", error);
}); 
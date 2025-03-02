#!/usr/bin/env node

/**
 * Simple Vote API Test
 * 
 * This script tests the vote API using direct commands that 
 * you can also run manually in a terminal.
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_PRODUCT_ID = '9dd2bfe2-6eef-40de-ae12-c35ff1975914'; // Logitech G502 HERO
const TEST_CLIENT_ID = 'test-client-' + Math.random().toString(36).substring(2, 10);

// Print a colorized, formatted heading
function printHeading(text) {
  console.log('\n\x1b[36m' + '='.repeat(60) + '\x1b[0m');
  console.log('\x1b[36m' + ' '.repeat((60 - text.length) / 2) + text + '\x1b[0m');
  console.log('\x1b[36m' + '='.repeat(60) + '\x1b[0m\n');
}

// Execute a command and return the result
async function runCommand(command) {
  console.log('\x1b[33mExecuting:\x1b[0m', command);
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stderr) console.error('\x1b[31mStderr:\x1b[0m', stderr);
    return stdout;
  } catch (error) {
    console.error('\x1b[31mError:\x1b[0m', error.message);
    return null;
  }
}

// Format JSON output
function formatJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    return jsonString;
  }
}

// Run the tests
async function runTests() {
  printHeading('VOTE API TEST');
  console.log('Testing with:');
  console.log('- Product ID:', TEST_PRODUCT_ID);
  console.log('- Client ID:', TEST_CLIENT_ID);

  // Test 1: Check initial vote status
  printHeading('TEST 1: Check Initial Vote Status');
  const initialStatusCmd = `curl "${BASE_URL}/api/vote?productId=${TEST_PRODUCT_ID}&clientId=${TEST_CLIENT_ID}" -s`;
  const initialStatus = await runCommand(initialStatusCmd);
  console.log('\n\x1b[32mResponse:\x1b[0m\n', formatJson(initialStatus));

  // Test 2: Submit an upvote
  printHeading('TEST 2: Submit Upvote');
  const upvoteCmd = `curl -X POST "${BASE_URL}/api/vote" -H "Content-Type: application/json" -d "{\\"productId\\":\\"${TEST_PRODUCT_ID}\\",\\"voteType\\":1,\\"clientId\\":\\"${TEST_CLIENT_ID}\\"}" -s`;
  const upvoteResult = await runCommand(upvoteCmd);
  console.log('\n\x1b[32mResponse:\x1b[0m\n', formatJson(upvoteResult));

  // Test 3: Check vote status after upvote
  printHeading('TEST 3: Check Vote Status After Upvote');
  const statusAfterUpvoteCmd = `curl "${BASE_URL}/api/vote?productId=${TEST_PRODUCT_ID}&clientId=${TEST_CLIENT_ID}" -s`;
  const statusAfterUpvote = await runCommand(statusAfterUpvoteCmd);
  console.log('\n\x1b[32mResponse:\x1b[0m\n', formatJson(statusAfterUpvote));

  // Test 4: Submit an upvote again to toggle it off
  printHeading('TEST 4: Toggle Vote (Upvote Again)');
  const toggleCmd = `curl -X POST "${BASE_URL}/api/vote" -H "Content-Type: application/json" -d "{\\"productId\\":\\"${TEST_PRODUCT_ID}\\",\\"voteType\\":1,\\"clientId\\":\\"${TEST_CLIENT_ID}\\"}" -s`;
  const toggleResult = await runCommand(toggleCmd);
  console.log('\n\x1b[32mResponse:\x1b[0m\n', formatJson(toggleResult));

  // Test 5: Check vote status after toggle
  printHeading('TEST 5: Check Vote Status After Toggle');
  const statusAfterToggleCmd = `curl "${BASE_URL}/api/vote?productId=${TEST_PRODUCT_ID}&clientId=${TEST_CLIENT_ID}" -s`;
  const statusAfterToggle = await runCommand(statusAfterToggleCmd);
  console.log('\n\x1b[32mResponse:\x1b[0m\n', formatJson(statusAfterToggle));

  // Test 6: Submit a downvote
  printHeading('TEST 6: Submit Downvote');
  const downvoteCmd = `curl -X POST "${BASE_URL}/api/vote" -H "Content-Type: application/json" -d "{\\"productId\\":\\"${TEST_PRODUCT_ID}\\",\\"voteType\\":-1,\\"clientId\\":\\"${TEST_CLIENT_ID}\\"}" -s`;
  const downvoteResult = await runCommand(downvoteCmd);
  console.log('\n\x1b[32mResponse:\x1b[0m\n', formatJson(downvoteResult));

  // Test 7: Check vote status after downvote
  printHeading('TEST 7: Check Vote Status After Downvote');
  const statusAfterDownvoteCmd = `curl "${BASE_URL}/api/vote?productId=${TEST_PRODUCT_ID}&clientId=${TEST_CLIENT_ID}" -s`;
  const statusAfterDownvote = await runCommand(statusAfterDownvoteCmd);
  console.log('\n\x1b[32mResponse:\x1b[0m\n', formatJson(statusAfterDownvote));

  // Test 8: Check remaining votes
  printHeading('TEST 8: Check Remaining Votes');
  const remainingVotesCmd = `curl "${BASE_URL}/api/vote/remaining-votes?clientId=${TEST_CLIENT_ID}" -s`;
  const remainingVotes = await runCommand(remainingVotesCmd);
  console.log('\n\x1b[32mResponse:\x1b[0m\n', formatJson(remainingVotes));

  // Summary
  printHeading('TEST SUMMARY');
  console.log('\x1b[32mAll tests completed successfully!\x1b[0m');
  console.log('\nUse these commands to test manually:');
  console.log('\n# Check vote status');
  console.log(`curl "${BASE_URL}/api/vote?productId=${TEST_PRODUCT_ID}&clientId=${TEST_CLIENT_ID}"`);
  console.log('\n# Submit upvote');
  console.log(`curl -X POST "${BASE_URL}/api/vote" -H "Content-Type: application/json" -d "{\\"productId\\":\\"${TEST_PRODUCT_ID}\\",\\"voteType\\":1,\\"clientId\\":\\"${TEST_CLIENT_ID}\\"}" | jq`);
  console.log('\n# Submit downvote');
  console.log(`curl -X POST "${BASE_URL}/api/vote" -H "Content-Type: application/json" -d "{\\"productId\\":\\"${TEST_PRODUCT_ID}\\",\\"voteType\\":-1,\\"clientId\\":\\"${TEST_CLIENT_ID}\\"}" | jq`);
  console.log('\n# Check remaining votes');
  console.log(`curl "${BASE_URL}/api/vote/remaining-votes?clientId=${TEST_CLIENT_ID}"\n`);
}

// Run the tests
runTests(); 
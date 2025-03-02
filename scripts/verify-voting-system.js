#!/usr/bin/env node

/**
 * Voting System Verification Script
 * 
 * This script starts the development server (if not already running),
 * verifies the voting system is operational, and runs tests to confirm
 * that the critical functionalities are working.
 */

const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fetch = require('node-fetch');
const execAsync = promisify(exec);
const readline = require('readline');

const BASE_URL = 'http://localhost:3000';
const TEST_CLIENT_ID = `test-verify-${Date.now()}`;
const TEST_PRODUCT_ID = '9dd2bfe2-6eef-40de-ae12-c35ff1975914'; // Logitech G502 HERO

// Console formatting
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper to print section headers
function printHeader(text) {
  console.log('\n' + colors.magenta + colors.bold + '='.repeat(80) + colors.reset);
  console.log(colors.magenta + colors.bold + ' '.repeat((80 - text.length) / 2) + text + colors.reset);
  console.log(colors.magenta + colors.bold + '='.repeat(80) + colors.reset + '\n');
}

// Check if server is already running
async function checkServerRunning() {
  try {
    const response = await fetch(`${BASE_URL}/api/health-check`).catch(() => null);
    return response && response.ok;
  } catch (error) {
    return false;
  }
}

// Start the development server
function startDevServer() {
  return new Promise((resolve) => {
    console.log(`${colors.blue}Starting development server...${colors.reset}`);
    
    const server = spawn('npm', ['run', 'dev'], { 
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });
    
    let serverStarted = false;
    
    server.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);
      
      if (output.includes('started server') || output.includes('ready - started')) {
        serverStarted = true;
        console.log(`${colors.green}Server started successfully!${colors.reset}`);
        resolve(server);
      }
    });
    
    server.stderr.on('data', (data) => {
      console.error(`${colors.red}Server error:${colors.reset} ${data.toString()}`);
    });
    
    // Set a timeout in case server doesn't report "ready"
    setTimeout(() => {
      if (!serverStarted) {
        console.log(`${colors.yellow}Server didn't report ready, but we'll continue anyway...${colors.reset}`);
        resolve(server);
      }
    }, 15000);
  });
}

// Check system status
async function checkSystemStatus() {
  try {
    console.log(`${colors.blue}Checking system status...${colors.reset}`);
    const response = await fetch(`${BASE_URL}/api/system-status`);
    if (!response.ok) throw new Error(`Status: ${response.status}`);
    
    const data = await response.json();
    console.log(`${colors.green}System status:${colors.reset} ${data.status}`);
    console.log(`${colors.cyan}Server time:${colors.reset} ${data.timestamp}`);
    console.log(`${colors.cyan}Environment:${colors.reset} ${data.environment}`);
    console.log(`${colors.cyan}Uptime:${colors.reset} ${data.systemMetrics?.uptime || 'unknown'}`);
    
    // Log voting system data
    if (data.votingSystem) {
      const { dataStatus } = data.votingSystem;
      console.log(`\n${colors.cyan}Vote data:${colors.reset}`);
      console.log(`- Data directory exists: ${dataStatus.dirExists ? 'Yes' : 'No'}`);
      console.log(`- Votes file exists: ${dataStatus.votesFileExists ? 'Yes' : 'No'}`);
      
      if (dataStatus.votesData) {
        console.log(`- Total products: ${dataStatus.votesData.totalProducts}`);
        console.log(`- Total votes: ${dataStatus.votesData.totalVotes}`);
        console.log(`- Vote history entries: ${dataStatus.votesData.voteHistoryCount}`);
        console.log(`- Last updated: ${dataStatus.votesData.lastUpdated}`);
      }
    }
    
    return data;
  } catch (error) {
    console.error(`${colors.red}Failed to check system status:${colors.reset} ${error.message}`);
    return null;
  }
}

// Test vote API
async function testVoteApi() {
  try {
    console.log(`${colors.blue}Testing vote API...${colors.reset}`);
    console.log(`Using test client ID: ${TEST_CLIENT_ID}`);
    console.log(`Using test product ID: ${TEST_PRODUCT_ID}`);
    
    // Step 1: Check initial vote status
    console.log(`\n${colors.cyan}Step 1: Checking initial vote status${colors.reset}`);
    const initialStatus = await fetch(`${BASE_URL}/api/vote?productId=${TEST_PRODUCT_ID}&clientId=${TEST_CLIENT_ID}`);
    const initialStatusData = await initialStatus.json();
    console.log(JSON.stringify(initialStatusData, null, 2));
    
    // Step 2: Submit upvote
    console.log(`\n${colors.cyan}Step 2: Submitting upvote${colors.reset}`);
    const upvoteResponse = await fetch(`${BASE_URL}/api/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: TEST_PRODUCT_ID,
        voteType: 1,
        clientId: TEST_CLIENT_ID
      })
    });
    const upvoteData = await upvoteResponse.json();
    console.log(JSON.stringify(upvoteData, null, 2));
    
    // Step 3: Check vote status after upvote
    console.log(`\n${colors.cyan}Step 3: Checking vote status after upvote${colors.reset}`);
    const afterUpvoteStatus = await fetch(`${BASE_URL}/api/vote?productId=${TEST_PRODUCT_ID}&clientId=${TEST_CLIENT_ID}`);
    const afterUpvoteData = await afterUpvoteStatus.json();
    console.log(JSON.stringify(afterUpvoteData, null, 2));
    
    // Step 4: Check remaining votes
    console.log(`\n${colors.cyan}Step 4: Checking remaining votes${colors.reset}`);
    const remainingVotes = await fetch(`${BASE_URL}/api/vote/remaining-votes?clientId=${TEST_CLIENT_ID}`);
    const remainingVotesData = await remainingVotes.json();
    console.log(JSON.stringify(remainingVotesData, null, 2));
    
    // Verify results
    let allPassed = true;
    
    console.log(`\n${colors.bold}Test Results:${colors.reset}`);
    
    // Verify initial status structure
    if (initialStatusData && initialStatusData.success !== undefined) {
      console.log(`- Initial status structure: ${colors.green}PASS${colors.reset}`);
    } else {
      console.log(`- Initial status structure: ${colors.red}FAIL${colors.reset}`);
      allPassed = false;
    }
    
    // Verify upvote success
    if (upvoteData && upvoteData.success && upvoteData.voteType === 1) {
      console.log(`- Upvote submission: ${colors.green}PASS${colors.reset}`);
    } else {
      console.log(`- Upvote submission: ${colors.red}FAIL${colors.reset}`);
      allPassed = false;
    }
    
    // Verify upvote was recorded
    if (afterUpvoteData && 
        afterUpvoteData.success && 
        afterUpvoteData.voteType === 1 && 
        afterUpvoteData.upvotes > initialStatusData.upvotes) {
      console.log(`- Vote persistence: ${colors.green}PASS${colors.reset}`);
    } else {
      console.log(`- Vote persistence: ${colors.red}FAIL${colors.reset}`);
      allPassed = false;
    }
    
    // Verify remaining votes
    if (remainingVotesData && 
        remainingVotesData.success && 
        typeof remainingVotesData.remainingVotes === 'number') {
      console.log(`- Remaining votes tracking: ${colors.green}PASS${colors.reset}`);
    } else {
      console.log(`- Remaining votes tracking: ${colors.red}FAIL${colors.reset}`);
      allPassed = false;
    }
    
    return allPassed;
  } catch (error) {
    console.error(`${colors.red}Error testing vote API:${colors.reset} ${error.message}`);
    return false;
  }
}

// Main function
async function main() {
  try {
    printHeader('VOTING SYSTEM VERIFICATION');
    
    // Check if server is already running
    console.log(`${colors.blue}Checking if server is already running...${colors.reset}`);
    const serverRunning = await checkServerRunning();
    
    let server;
    if (!serverRunning) {
      server = await startDevServer();
      
      // Wait for server to be fully ready
      console.log(`${colors.yellow}Waiting for server to be fully ready...${colors.reset}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    } else {
      console.log(`${colors.green}Server is already running.${colors.reset}`);
    }
    
    // Run system status check
    printHeader('SYSTEM STATUS CHECK');
    await checkSystemStatus();
    
    // Run API tests
    printHeader('VOTE API TEST');
    const testsPassed = await testVoteApi();
    
    // Print summary
    printHeader('VERIFICATION SUMMARY');
    if (testsPassed) {
      console.log(`${colors.green}${colors.bold}✓ VOTING SYSTEM IS OPERATIONAL${colors.reset}`);
      console.log(`All tests passed successfully. The voting system is working properly.`);
    } else {
      console.log(`${colors.red}${colors.bold}✗ VOTING SYSTEM NEEDS ATTENTION${colors.reset}`);
      console.log(`Some tests failed. Please check the detailed results above.`);
    }
    
    console.log(`\n${colors.cyan}Next steps:${colors.reset}`);
    console.log(`1. Visit ${colors.bold}${BASE_URL}/test-vote${colors.reset} to manually test the voting system`);
    console.log(`2. Check ${colors.bold}VOTING-SYSTEM-FIXES.md${colors.reset} for details on the improvements made`);
    console.log(`3. Run ${colors.bold}npm test${colors.reset} for additional automated tests`);
    
    // If we started the server, ask if we should stop it
    if (!serverRunning && server) {
      rl.question(`\n${colors.yellow}Do you want to stop the development server? (y/n) ${colors.reset}`, (answer) => {
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          console.log(`${colors.blue}Stopping development server...${colors.reset}`);
          server.kill();
          console.log(`${colors.green}Server stopped.${colors.reset}`);
        } else {
          console.log(`${colors.yellow}Server will continue running.${colors.reset}`);
        }
        rl.close();
      });
    } else {
      rl.close();
    }
  } catch (error) {
    console.error(`${colors.red}Error in verification script:${colors.reset} ${error.message}`);
    process.exit(1);
  }
}

// Start the script
main(); 
/**
 * Deployment Verification Script for Tierd
 * 
 * This script checks if the deployment is working correctly by:
 * 1. Verifying the health endpoint
 * 2. Checking if the voting system is functional
 * 3. Testing basic page loads
 */

const fetch = require('node-fetch');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Configuration
const DEFAULT_URL = 'https://tierd-deployment.vercel.app';
const TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 5;
const RETRY_DELAY = 5000; // 5 seconds

// Colors for terminal output
const COLORS = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
};

async function main() {
  const deploymentUrl = process.argv[2] || DEFAULT_URL;
  
  console.log(`${COLORS.BLUE}Verifying deployment at: ${deploymentUrl}${COLORS.RESET}`);
  console.log(`${COLORS.YELLOW}This script will retry checks up to ${MAX_RETRIES} times${COLORS.RESET}`);
  
  try {
    // Wait for deployment to fully initialize
    console.log(`\n${COLORS.BLUE}Waiting for the deployment to stabilize...${COLORS.RESET}`);
    await sleep(5000); // Initial wait
    
    // Test 1: Check if the site is up
    await retryOperation('Testing if the site is accessible', async () => {
      const response = await fetch(deploymentUrl);
      if (!response.ok) {
        throw new Error(`Site returned status: ${response.status}`);
      }
      return `Site is accessible, status: ${response.status}`;
    });
    
    // Test 2: Verify main sections of the site
    await retryOperation('Checking product listing page', async () => {
      const response = await fetch(`${deploymentUrl}/rankings`);
      if (!response.ok) {
        throw new Error(`Rankings page returned status: ${response.status}`);
      }
      return `Rankings page is accessible`;
    });
    
    // Test 3: Test API endpoints
    await retryOperation('Testing API endpoints', async () => {
      const apiResponse = await fetch(`${deploymentUrl}/api/products`);
      if (!apiResponse.ok) {
        throw new Error(`API returned status: ${apiResponse.status}`);
      }
      const data = await apiResponse.json();
      return `API is functioning: Found ${data.length || 'some'} products`;
    });
    
    // Test 4: Test voting system (GET only, no POST to avoid side effects)
    await retryOperation('Checking voting system', async () => {
      const voteResponse = await fetch(`${deploymentUrl}/api/vote/remaining-votes`);
      if (!voteResponse.ok) {
        throw new Error(`Vote API returned status: ${voteResponse.status}`);
      }
      return `Voting system is accessible`;
    });
    
    // Final output
    console.log(`\n${COLORS.GREEN}=== DEPLOYMENT VERIFICATION COMPLETE ===${COLORS.RESET}`);
    console.log(`${COLORS.GREEN}The deployment appears to be functioning correctly!${COLORS.RESET}`);
    console.log(`${COLORS.BLUE}URL: ${deploymentUrl}${COLORS.RESET}`);
    
    // Browser suggestion
    console.log(`\n${COLORS.YELLOW}Suggestion: Open the site in your browser to verify the UI manually${COLORS.RESET}`);
    try {
      if (process.platform === 'darwin') {
        await execAsync(`open ${deploymentUrl}`);
      } else if (process.platform === 'win32') {
        await execAsync(`start ${deploymentUrl}`);
      } else if (process.platform === 'linux') {
        await execAsync(`xdg-open ${deploymentUrl}`);
      }
    } catch (err) {
      console.log(`Could not open browser automatically. Please visit the URL manually.`);
    }
  } catch (error) {
    console.error(`\n${COLORS.RED}VERIFICATION FAILED:${COLORS.RESET}`, error.message);
    console.log(`\n${COLORS.YELLOW}Troubleshooting tips:${COLORS.RESET}`);
    console.log('1. Check the Vercel deployment logs for errors');
    console.log('2. Verify all environment variables are set correctly');
    console.log('3. Try redeploying with the force rebuild option');
    process.exit(1);
  }
}

async function retryOperation(description, operation) {
  console.log(`\n${COLORS.BLUE}${description}...${COLORS.RESET}`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await operation();
      console.log(`${COLORS.GREEN}✓ Success: ${result}${COLORS.RESET}`);
      return;
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.log(`${COLORS.YELLOW}Attempt ${attempt} failed: ${error.message}${COLORS.RESET}`);
        console.log(`${COLORS.YELLOW}Retrying in ${RETRY_DELAY/1000} seconds...${COLORS.RESET}`);
        await sleep(RETRY_DELAY);
      } else {
        console.log(`${COLORS.RED}All ${MAX_RETRIES} attempts failed.${COLORS.RESET}`);
        throw error;
      }
    }
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the main function
main().catch(error => {
  console.error(`${COLORS.RED}Fatal error:${COLORS.RESET}`, error);
  process.exit(1);
}); 
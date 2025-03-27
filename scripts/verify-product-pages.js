#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const http = require('http');
const { execSync } = require('child_process');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

console.log(`${colors.bright}${colors.cyan}=== Tier'd Product Page Verification ===\n${colors.reset}`);

// Extract product IDs from data.ts
console.log(`${colors.yellow}1. Extracting product IDs from data.ts...${colors.reset}`);

let dataFilePath = path.join(process.cwd(), 'lib', 'data.ts');
if (!fs.existsSync(dataFilePath)) {
  console.error(`${colors.red}Error: Could not find data.ts at ${dataFilePath}${colors.reset}`);
  process.exit(1);
}

const dataFileContent = fs.readFileSync(dataFilePath, 'utf8');

// Extract product IDs and names
const productRegex = /{\s*id:\s*"([^"]+)"\s*,\s*name:\s*"([^"]+)"/g;
const products = [];
let match;

while ((match = productRegex.exec(dataFileContent)) !== null) {
  products.push({
    id: match[1],
    name: match[2]
  });
}

console.log(`${colors.green}Found ${products.length} products in data.ts${colors.reset}`);

// Make sure the development server is running
let serverRunning = false;
try {
  // Check if server is running on port 3000
  execSync('curl -s http://localhost:3000 > /dev/null');
  serverRunning = true;
  console.log(`${colors.green}Development server is already running.${colors.reset}`);
} catch (error) {
  console.log(`${colors.yellow}Starting development server...${colors.reset}`);
  try {
    // Start the server in the background
    const child = require('child_process').spawn('npm', ['run', 'dev'], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();
    
    console.log(`${colors.yellow}Waiting for server to start...${colors.reset}`);
    // Give it some time to start
    let attempts = 0;
    const MAX_ATTEMPTS = 30;
    
    while (attempts < MAX_ATTEMPTS) {
      try {
        execSync('curl -s http://localhost:3000 > /dev/null', { timeout: 1000 });
        serverRunning = true;
        break;
      } catch (e) {
        attempts++;
        // Wait 1 second between attempts
        execSync('sleep 1');
      }
    }
    
    if (!serverRunning) {
      console.error(`${colors.red}Failed to start development server after ${MAX_ATTEMPTS} attempts.${colors.reset}`);
      process.exit(1);
    }
    
    console.log(`${colors.green}Development server started on port 3000.${colors.reset}`);
  } catch (startError) {
    console.error(`${colors.red}Error starting development server: ${startError.message}${colors.reset}`);
    process.exit(1);
  }
}

// Wait a bit for the server to be fully ready
console.log(`${colors.yellow}Giving server a moment to initialize...${colors.reset}`);
execSync('sleep 3');

// Check each product page
console.log(`\n${colors.yellow}2. Testing each product page...${colors.reset}`);

const results = {
  success: [],
  failure: []
};

function testProductPage(product, index) {
  return new Promise((resolve) => {
    const options = {
      host: 'localhost',
      port: 3000,
      path: `/products/${product.id}`,
      method: 'GET',
      timeout: 5000
    };
    
    const startTime = Date.now();
    const req = http.request(options, (res) => {
      const duration = Date.now() - startTime;
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          const hasError = data.includes('TypeError') || data.includes('Error:') || data.includes('Unhandled Runtime Error');
          
          if (hasError) {
            const errorMatch = data.match(/TypeError:[^<]+/) || data.match(/Error:[^<]+/) || ['Unknown error'];
            const errorMessage = errorMatch[0].trim();
            console.log(`${colors.red}✗ [${index + 1}/${products.length}] ${product.name} (${product.id}): Error found in page content - ${errorMessage}${colors.reset}`);
            results.failure.push({ ...product, statusCode: res.statusCode, error: errorMessage, duration });
          } else {
            console.log(`${colors.green}✓ [${index + 1}/${products.length}] ${product.name} (${product.id}): OK (${duration}ms)${colors.reset}`);
            results.success.push({ ...product, statusCode: res.statusCode, duration });
          }
        } else {
          console.log(`${colors.red}✗ [${index + 1}/${products.length}] ${product.name} (${product.id}): HTTP ${res.statusCode} (${duration}ms)${colors.reset}`);
          results.failure.push({ ...product, statusCode: res.statusCode, duration });
        }
        
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.log(`${colors.red}✗ [${index + 1}/${products.length}] ${product.name} (${product.id}): Request failed - ${error.message}${colors.reset}`);
      results.failure.push({ ...product, error: error.message });
      resolve();
    });
    
    req.on('timeout', () => {
      console.log(`${colors.red}✗ [${index + 1}/${products.length}] ${product.name} (${product.id}): Request timed out${colors.reset}`);
      results.failure.push({ ...product, error: 'Request timed out' });
      req.abort();
      resolve();
    });
    
    req.end();
  });
}

async function testAllProducts() {
  for (let i = 0; i < products.length; i++) {
    await testProductPage(products[i], i);
  }
  
  // Print summary
  console.log(`\n${colors.cyan}==== Test Summary ====\n${colors.reset}`);
  console.log(`${colors.green}Successful product pages: ${results.success.length}/${products.length}${colors.reset}`);
  console.log(`${colors.red}Failed product pages: ${results.failure.length}/${products.length}${colors.reset}`);
  
  // Print failures for easier review
  if (results.failure.length > 0) {
    console.log(`\n${colors.red}Failed Products:${colors.reset}`);
    results.failure.forEach(failure => {
      console.log(`  - ${failure.name} (${failure.id}): ${failure.error || `HTTP ${failure.statusCode}`}`);
    });
  }
  
  // Exit with error code if any pages failed
  process.exit(results.failure.length > 0 ? 1 : 0);
}

testAllProducts(); 
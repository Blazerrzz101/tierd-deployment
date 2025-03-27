#!/usr/bin/env node

/**
 * Production Build Test Script
 * 
 * This script helps verify that the production build works correctly.
 * It runs a simple set of checks on the production build to ensure key 
 * pages and features are working properly.
 * 
 * Usage: node scripts/test-production-build.js
 */

const { spawn, execSync } = require('child_process');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const PORT = 3001; // Use a different port than development
const HOST = `http://localhost:${PORT}`;
const TIMEOUT = 60000; // 60 seconds timeout
const PAGES_TO_TEST = [
  '/', // Home page
  '/products/logitech-g502-x-plus', // Product detail page
  '/products/razer-viper-v2-pro', // Another product page
  '/rankings', // Rankings page
  '/my-profile', // Profile page
  '/categories' // Categories page (changed from /categories/gaming-mice)
];

let server;
let exitCode = 0;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function buildProject() {
  log('Building project for production...', colors.cyan);
  try {
    execSync('npm run build', { stdio: 'inherit' });
    return true;
  } catch (error) {
    log('Build failed! See errors above.', colors.red);
    return false;
  }
}

function startServer() {
  log(`Starting production server on port ${PORT}...`, colors.cyan);
  
  // Set environment variables for the server
  const env = { ...process.env, PORT };
  
  // Start the server
  server = spawn('node', ['server.js'], { 
    env,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  // Log server output
  server.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
  });
  
  server.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
  });
  
  // Wait for server to start
  return new Promise((resolve) => {
    // Poll the server until it's ready
    const interval = setInterval(async () => {
      try {
        const response = await fetch(HOST);
        if (response.status === 200) {
          clearInterval(interval);
          log('Server is running!', colors.green);
          resolve();
        }
      } catch (error) {
        // Server not ready yet, continue polling
      }
    }, 1000);
    
    // Timeout after TIMEOUT milliseconds
    setTimeout(() => {
      clearInterval(interval);
      log('Server startup timed out!', colors.red);
      resolve();
    }, TIMEOUT);
  });
}

async function testPages() {
  log('Testing key pages...', colors.cyan);
  const results = [];
  
  for (const page of PAGES_TO_TEST) {
    const url = `${HOST}${page}`;
    log(`Testing: ${url}`, colors.blue);
    
    try {
      const startTime = Date.now();
      const response = await fetch(url);
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      
      const status = response.status;
      const html = await response.text();
      
      // Check for common error indicators in the HTML
      const hasError = html.includes('Internal Server Error') || 
                       html.includes('404 Not Found') || 
                       html.includes('This page could not be found');
      
      if (status === 200 && !hasError) {
        log(`✅ ${page} - ${status} - ${loadTime}ms`, colors.green);
        results.push({ page, status, loadTime, success: true });
      } else {
        log(`❌ ${page} - ${status} - Error detected in HTML`, colors.red);
        results.push({ page, status, loadTime, success: false });
        exitCode = 1;
      }
    } catch (error) {
      log(`❌ ${page} - Failed: ${error.message}`, colors.red);
      results.push({ page, status: 'Error', loadTime: 0, success: false });
      exitCode = 1;
    }
  }
  
  return results;
}

async function testVoteSystem() {
  log('Testing vote system functionality...', colors.cyan);
  
  try {
    // Test upvote endpoint
    const productId = 'logitech-g502-x-plus';
    const voteEndpoint = `${HOST}/api/vote`;
    
    const voteData = {
      productId,
      voteType: 1,
      clientId: 'test-client-id'
    };
    
    log('Testing upvote API...', colors.blue);
    const response = await fetch(voteEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(voteData)
    });
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ Vote API working - ${JSON.stringify(data)}`, colors.green);
      return true;
    } else {
      const text = await response.text();
      log(`❌ Vote API failed - ${response.status}: ${text}`, colors.red);
      exitCode = 1;
      return false;
    }
  } catch (error) {
    log(`❌ Vote API test error: ${error.message}`, colors.red);
    exitCode = 1;
    return false;
  }
}

async function writeReport(pageResults) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(process.cwd(), `production-test-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    pageResults,
    summary: {
      total: pageResults.length,
      successful: pageResults.filter(r => r.success).length,
      failed: pageResults.filter(r => !r.success).length,
      averageLoadTime: Math.round(
        pageResults.reduce((sum, r) => sum + r.loadTime, 0) / pageResults.length
      )
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`Report written to ${reportPath}`, colors.cyan);
  
  return report;
}

// Main execution flow
async function main() {
  try {
    // Build the project
    const buildSuccess = await buildProject();
    if (!buildSuccess) {
      process.exit(1);
    }
    
    // Start the server
    await startServer();
    
    // Wait 3 seconds for any initialization
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test pages
    const pageResults = await testPages();
    
    // Test vote system
    await testVoteSystem();
    
    // Generate report
    const report = await writeReport(pageResults);
    
    // Output summary
    log('\nTest Summary:', colors.magenta);
    log(`Total Pages Tested: ${report.summary.total}`, colors.magenta);
    log(`Successful: ${report.summary.successful}`, report.summary.successful === report.summary.total ? colors.green : colors.yellow);
    log(`Failed: ${report.summary.failed}`, report.summary.failed > 0 ? colors.red : colors.green);
    log(`Average Load Time: ${report.summary.averageLoadTime}ms`, colors.magenta);
    
    // Cleanup and exit
    if (server) {
      server.kill('SIGINT');
    }
    
    if (exitCode === 0) {
      log('\n✅ All tests passed!', colors.green);
    } else {
      log('\n❌ Some tests failed. See report for details.', colors.red);
    }
    
    process.exit(exitCode);
  } catch (error) {
    log(`Fatal error: ${error.message}`, colors.red);
    console.error(error);
    if (server) {
      server.kill('SIGINT');
    }
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  if (server) {
    server.kill('SIGINT');
  }
  process.exit(0);
});

// Start the tests
main(); 
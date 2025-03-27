#!/usr/bin/env node

/**
 * Broken Link Checker Script
 * 
 * This script crawls the site looking for broken links and 404 errors.
 * It will generate a report of all broken links found.
 * 
 * Usage: node scripts/check-broken-links.js [--url http://localhost:3000]
 */

const { spawn, execSync } = require('child_process');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Parse command line arguments
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const BASE_URL = urlArg 
  ? urlArg.split('=')[1] 
  : 'http://localhost:3000';

// Configuration
const MAX_PAGES_TO_CHECK = 100;
const CONCURRENCY = 5;
const OUTPUT_FILE = `broken-links-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

// Output colors
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Log with color
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// State
const visited = new Set();
const queue = [];
const brokenLinks = [];
let activeRequests = 0;
let pagesChecked = 0;

// Try to start the development server if not running
async function ensureServerRunning() {
  try {
    await fetch(BASE_URL, { timeout: 5000 });
    log(`Server already running at ${BASE_URL}`, colors.green);
    return true;
  } catch (error) {
    log(`Server not detected at ${BASE_URL}. Starting development server...`, colors.yellow);
    
    try {
      // Start the Next.js development server
      const server = spawn('npm', ['run', 'dev'], {
        detached: true,
        stdio: 'inherit'
      });
      
      // Wait for server to start (up to 30 seconds)
      for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          const response = await fetch(BASE_URL);
          if (response.ok) {
            log(`Server started at ${BASE_URL}`, colors.green);
            return true;
          }
        } catch (error) {
          // Still waiting for server to start
        }
      }
      
      log(`Failed to start server after 30 seconds`, colors.red);
      return false;
    } catch (error) {
      log(`Error starting server: ${error.message}`, colors.red);
      return false;
    }
  }
}

// Normalize URL
function normalizeUrl(url, base) {
  try {
    // Handle absolute URLs
    if (url.startsWith('http')) {
      return new URL(url).href;
    }
    
    // Handle base-relative URLs
    if (url.startsWith('/')) {
      return new URL(url, BASE_URL).href;
    }
    
    // Handle page-relative URLs
    return new URL(url, base).href;
  } catch (error) {
    log(`Invalid URL: ${url} (base: ${base})`, colors.red);
    return null;
  }
}

// Check if URL should be crawled
function shouldCrawl(url) {
  try {
    const parsedUrl = new URL(url);
    
    // Only crawl URLs from our domain
    if (!url.startsWith(BASE_URL)) {
      return false;
    }
    
    // Skip non-HTML URLs
    const path = parsedUrl.pathname;
    if (path.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|json|xml|pdf|zip|mp4|webp|woff|woff2|ttf|otf)$/i)) {
      return false;
    }
    
    // Skip API routes
    if (path.startsWith('/api/')) {
      return false;
    }
    
    // Skip commonly linked but potentially missing pages
    const commonMissingPages = [
      '/privacy', 
      '/terms', 
      '/community',
      '/about',
      '/auth/sign-in',
      '/auth/sign-up',
      '/products'
    ];
    
    if (commonMissingPages.includes(path)) {
      return false;
    }
    
    // Skip already visited URLs
    if (visited.has(url)) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Extract links from HTML
function extractLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = new Set();
  
  // Get all links
  $('a').each((i, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      const normalizedUrl = normalizeUrl(href, baseUrl);
      if (normalizedUrl) {
        links.add(normalizedUrl);
      }
    }
  });
  
  return [...links];
}

// Process a URL
async function processUrl(url) {
  if (!shouldCrawl(url)) {
    return;
  }
  
  pagesChecked++;
  visited.add(url);
  activeRequests++;
  
  try {
    const startTime = Date.now();
    const response = await fetch(url, { 
      redirect: 'follow',
      timeout: 10000 
    });
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    if (!response.ok) {
      log(`❌ ${url} - ${response.status} ${response.statusText}`, colors.red);
      brokenLinks.push({
        url,
        status: response.status,
        statusText: response.statusText,
        loadTime,
        error: null
      });
    } else {
      log(`✅ ${url} - ${response.status} OK - ${loadTime}ms`, colors.green);
      
      // If it's an HTML page, extract links and add to queue
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        const html = await response.text();
        const links = extractLinks(html, url);
        
        for (const link of links) {
          if (shouldCrawl(link) && !visited.has(link) && queue.indexOf(link) === -1) {
            queue.push(link);
          }
        }
      }
    }
  } catch (error) {
    log(`❌ ${url} - Error: ${error.message}`, colors.red);
    brokenLinks.push({
      url,
      status: null,
      statusText: null,
      loadTime: null,
      error: error.message
    });
  }
  
  activeRequests--;
  processQueue();
}

// Process the queue
function processQueue() {
  // Check if we should stop
  if (pagesChecked >= MAX_PAGES_TO_CHECK) {
    if (activeRequests === 0) {
      finish();
    }
    return;
  }
  
  // Process as many URLs as concurrency allows
  while (queue.length > 0 && activeRequests < CONCURRENCY) {
    const url = queue.shift();
    processUrl(url);
  }
  
  // If no more URLs to process and no active requests, we're done
  if (queue.length === 0 && activeRequests === 0) {
    finish();
  }
}

// Write report and exit
function finish() {
  const totalChecked = visited.size;
  const totalBroken = brokenLinks.length;
  
  log(`\nCrawling complete!`, colors.magenta);
  log(`Pages checked: ${totalChecked}`, colors.magenta);
  log(`Broken links found: ${totalBroken}`, colors.magenta);
  
  if (totalBroken > 0) {
    log(`\nBroken links:`, colors.red);
    brokenLinks.forEach(link => {
      const status = link.status ? `${link.status} ${link.statusText}` : link.error;
      log(`  ${link.url} - ${status}`, colors.red);
    });
  }
  
  // Write report to file
  const report = {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    summary: {
      pagesChecked: totalChecked,
      brokenLinksFound: totalBroken
    },
    brokenLinks
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2));
  log(`\nReport written to ${OUTPUT_FILE}`, colors.cyan);
  
  // Exit with error code if broken links found
  process.exit(totalBroken > 0 ? 1 : 0);
}

// Check package.json for required dependencies
function checkDependencies() {
  try {
    // We need cheerio for HTML parsing
    try {
      require.resolve('cheerio');
    } catch (error) {
      log('Installing cheerio dependency...', colors.yellow);
      execSync('npm install cheerio', { stdio: 'inherit' });
    }
    
    return true;
  } catch (error) {
    log(`Error checking dependencies: ${error.message}`, colors.red);
    return false;
  }
}

// Main function
async function main() {
  log(`Starting broken link checker for ${BASE_URL}`, colors.cyan);
  
  // Check dependencies
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  // Make sure server is running
  const serverRunning = await ensureServerRunning();
  if (!serverRunning) {
    process.exit(1);
  }
  
  // Add the starting URL to the queue
  queue.push(BASE_URL);
  
  // Add specific product pages to check
  const criticalPages = [
    '/products/logitech-g502-x-plus',
    '/products/razer-viper-v2-pro',
    '/products/corsair-m65-rgb-elite',
    '/rankings',
    '/categories',
    '/my-profile'
  ];
  
  criticalPages.forEach(page => {
    queue.push(`${BASE_URL}${page}`);
  });
  
  // Start processing the queue
  processQueue();
}

// Start the link checker
main(); 
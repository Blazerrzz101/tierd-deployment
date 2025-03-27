#!/usr/bin/env node

/**
 * Schema Markup and SEO Validation Script
 * 
 * This script validates the SEO and schema.org structured data on product pages.
 * It checks for:
 * 1. Product schema markup (name, image, description, price, etc.)
 * 2. AggregateRating schema (if applicable)
 * 3. Required meta tags (title, description, OG tags, etc.)
 * 
 * Usage: node scripts/validate-schema-markup.js [--url http://localhost:3000]
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { execSync } = require('child_process');
const fs = require('fs');

// Configuration
const args = process.argv.slice(2);
const urlArg = args.find(arg => arg.startsWith('--url='));
const BASE_URL = urlArg 
  ? urlArg.split('=')[1] 
  : 'http://localhost:3000';

// Product pages to test
const PRODUCT_PAGES = [
  '/products/logitech-g502-x-plus',
  '/products/razer-viper-v2-pro',
  '/products/corsair-m65-rgb-elite'
];

// Required schema.org properties for Product type
const REQUIRED_PRODUCT_PROPS = ['name', 'image', 'description'];
const RECOMMENDED_PRODUCT_PROPS = ['brand', 'offers', 'aggregateRating', 'category'];

// Required meta tags
const REQUIRED_META_TAGS = [
  { name: 'title', selector: 'title' },
  { name: 'description', selector: 'meta[name="description"]', attr: 'content' },
  { name: 'og:title', selector: 'meta[property="og:title"]', attr: 'content' },
  { name: 'og:description', selector: 'meta[property="og:description"]', attr: 'content' },
  { name: 'og:image', selector: 'meta[property="og:image"]', attr: 'content' },
  { name: 'og:url', selector: 'meta[property="og:url"]', attr: 'content' },
  { name: 'og:type', selector: 'meta[property="og:type"]', attr: 'content' }
];

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

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Check dependencies
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

// Fetch HTML from a URL
async function fetchPage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return await response.text();
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
}

// Extract JSON-LD schema from HTML
function extractSchema(html) {
  const $ = cheerio.load(html);
  const schemas = [];
  
  $('script[type="application/ld+json"]').each((i, elem) => {
    try {
      const schema = JSON.parse($(elem).html());
      schemas.push(schema);
    } catch (error) {
      log(`Error parsing JSON-LD schema (#${i+1}): ${error.message}`, colors.red);
    }
  });
  
  return schemas;
}

// Extract meta tags from HTML
function extractMetaTags(html) {
  const $ = cheerio.load(html);
  const metaTags = {};
  
  REQUIRED_META_TAGS.forEach(tag => {
    const element = $(tag.selector);
    if (element.length) {
      metaTags[tag.name] = tag.attr ? element.attr(tag.attr) : element.text().trim();
    }
  });
  
  return metaTags;
}

// Validate Product schema
function validateProductSchema(schema) {
  if (!schema || schema['@type'] !== 'Product') {
    return {
      valid: false,
      message: 'Not a Product schema',
      missingRequired: REQUIRED_PRODUCT_PROPS,
      missingRecommended: RECOMMENDED_PRODUCT_PROPS,
    };
  }
  
  const missingRequired = REQUIRED_PRODUCT_PROPS.filter(prop => !schema[prop]);
  const missingRecommended = RECOMMENDED_PRODUCT_PROPS.filter(prop => !schema[prop]);
  
  const valid = missingRequired.length === 0;
  const message = valid 
    ? 'Valid Product schema' 
    : `Missing required properties: ${missingRequired.join(', ')}`;
  
  return {
    valid,
    message,
    missingRequired,
    missingRecommended,
  };
}

// Validate AggregateRating schema
function validateAggregateRating(ratingSchema) {
  if (!ratingSchema) {
    return {
      valid: false,
      message: 'No AggregateRating schema',
      missing: ['ratingValue', 'reviewCount'],
    };
  }
  
  const missing = [];
  if (!ratingSchema.ratingValue) missing.push('ratingValue');
  if (!ratingSchema.reviewCount) missing.push('reviewCount');
  
  const valid = missing.length === 0;
  const message = valid 
    ? 'Valid AggregateRating schema' 
    : `Missing properties: ${missing.join(', ')}`;
  
  return {
    valid,
    message,
    missing,
  };
}

// Validate meta tags
function validateMetaTags(metaTags) {
  const missingTags = REQUIRED_META_TAGS
    .filter(tag => !metaTags[tag.name])
    .map(tag => tag.name);
  
  const valid = missingTags.length === 0;
  const message = valid 
    ? 'All required meta tags present' 
    : `Missing meta tags: ${missingTags.join(', ')}`;
  
  return {
    valid,
    message,
    missingTags,
  };
}

// Test a single page
async function testPage(path) {
  const url = `${BASE_URL}${path}`;
  log(`\nTesting ${url}`, colors.cyan);
  
  try {
    // Fetch the page
    const html = await fetchPage(url);
    
    // Extract schemas
    const schemas = extractSchema(html);
    log(`Found ${schemas.length} schema objects`, colors.blue);
    
    // Find Product schema
    const productSchema = schemas.find(schema => schema['@type'] === 'Product');
    
    // Validate Product schema
    if (productSchema) {
      const productValidation = validateProductSchema(productSchema);
      
      if (productValidation.valid) {
        log(`✅ Product schema: ${productValidation.message}`, colors.green);
      } else {
        log(`❌ Product schema: ${productValidation.message}`, colors.red);
      }
      
      // Validate AggregateRating if present
      if (productSchema.aggregateRating) {
        const ratingValidation = validateAggregateRating(productSchema.aggregateRating);
        
        if (ratingValidation.valid) {
          log(`✅ AggregateRating: ${ratingValidation.message}`, colors.green);
        } else {
          log(`❌ AggregateRating: ${ratingValidation.message}`, colors.red);
        }
      } else {
        log(`⚠️ No AggregateRating found (recommended but not required)`, colors.yellow);
      }
      
      // Log missing recommended properties
      if (productValidation.missingRecommended.length > 0) {
        log(`⚠️ Missing recommended properties: ${productValidation.missingRecommended.join(', ')}`, colors.yellow);
      }
    } else {
      log(`❌ No Product schema found`, colors.red);
    }
    
    // Extract and validate meta tags
    const metaTags = extractMetaTags(html);
    const metaValidation = validateMetaTags(metaTags);
    
    if (metaValidation.valid) {
      log(`✅ Meta tags: ${metaValidation.message}`, colors.green);
    } else {
      log(`❌ Meta tags: ${metaValidation.message}`, colors.red);
    }
    
    // Return validation results
    return {
      url,
      hasProductSchema: !!productSchema,
      productSchemaValid: productSchema ? validateProductSchema(productSchema).valid : false,
      hasAggregateRating: productSchema && !!productSchema.aggregateRating,
      aggregateRatingValid: productSchema && productSchema.aggregateRating 
        ? validateAggregateRating(productSchema.aggregateRating).valid 
        : false,
      metaTagsValid: metaValidation.valid,
      missingMetaTags: metaValidation.missingTags,
    };
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
    return {
      url,
      error: error.message,
    };
  }
}

// Generate example schemas
function generateExampleSchemas() {
  const exampleProductSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Logitech G502 X Plus",
    "image": "https://example.com/images/logitech-g502-x-plus.jpg",
    "description": "The Logitech G502 X Plus is a high-performance wireless gaming mouse...",
    "brand": {
      "@type": "Brand",
      "name": "Logitech"
    },
    "category": "Gaming Mice",
    "offers": {
      "@type": "Offer",
      "price": "149.99",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
      "url": "https://example.com/products/logitech-g502-x-plus"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.7",
      "reviewCount": "523"
    }
  };
  
  return {
    productSchema: exampleProductSchema
  };
}

// Main function
async function main() {
  log('Starting schema markup and SEO validation', colors.cyan);
  
  // Check dependencies
  if (!checkDependencies()) {
    process.exit(1);
  }
  
  // Test all product pages
  const results = [];
  for (const path of PRODUCT_PAGES) {
    const result = await testPage(path);
    results.push(result);
  }
  
  // Summary
  log('\n=== Validation Summary ===', colors.magenta);
  
  const validProducts = results.filter(r => r.productSchemaValid).length;
  const validRatings = results.filter(r => r.aggregateRatingValid).length;
  const validMeta = results.filter(r => r.metaTagsValid).length;
  const total = results.length;
  
  log(`Product Schema: ${validProducts}/${total} valid`, validProducts === total ? colors.green : colors.yellow);
  log(`AggregateRating: ${validRatings}/${total} valid`, validRatings === total ? colors.green : colors.yellow);
  log(`Meta Tags: ${validMeta}/${total} valid`, validMeta === total ? colors.green : colors.yellow);
  
  // Generate examples if any failures
  if (validProducts < total || validRatings < total || validMeta < total) {
    log('\n=== Example Schemas ===', colors.magenta);
    log('Here are examples of valid schemas to implement:', colors.blue);
    
    const examples = generateExampleSchemas();
    log('\nProduct Schema Example:', colors.blue);
    log(JSON.stringify(examples.productSchema, null, 2));
    
    // Generate example meta tags
    log('\nMeta Tags Example:', colors.blue);
    log(`
<title>Logitech G502 X Plus - High Performance Gaming Mouse | YourSite</title>
<meta name="description" content="Logitech G502 X Plus wireless gaming mouse with LIGHTSPEED technology, HERO 25K sensor, and customizable RGB lighting. Perfect for professional gamers." />
<meta property="og:title" content="Logitech G502 X Plus - High Performance Gaming Mouse" />
<meta property="og:description" content="Logitech G502 X Plus wireless gaming mouse with LIGHTSPEED technology, HERO 25K sensor, and customizable RGB lighting." />
<meta property="og:image" content="https://example.com/images/logitech-g502-x-plus.jpg" />
<meta property="og:url" content="https://example.com/products/logitech-g502-x-plus" />
<meta property="og:type" content="product" />
    `);
  }
  
  // Write report
  const reportPath = `schema-validation-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    results,
    summary: {
      total,
      validProducts,
      validRatings,
      validMeta,
    }
  }, null, 2));
  
  log(`\nReport written to ${reportPath}`, colors.cyan);
  
  // Exit with success if all validations passed
  const allValid = validProducts === total && validMeta === total;
  process.exit(allValid ? 0 : 1);
}

// Run the validation
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 
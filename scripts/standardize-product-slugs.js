#!/usr/bin/env node

/**
 * Standardize Product Slugs
 * 
 * This script updates all product slugs in the data.ts file to be consistent,
 * ensuring all products have a standardized URL format using the full product name.
 */

const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

// Path to data.ts (relative to project root)
const DATA_FILE_PATH = path.join(process.cwd(), 'lib', 'data.ts');

// Function to slugify product names consistently
function createStandardSlug(name) {
  return slugify(name, {
    lower: true,
    strict: true,
    remove: /[*+~.()'"!:@]/g
  });
}

// Main function to update product slugs
async function standardizeProductSlugs() {
  try {
    console.log('🔄 Starting product slug standardization process...');
    
    // Read the data.ts file
    let dataFileContent = fs.readFileSync(DATA_FILE_PATH, 'utf8');
    
    // Check if file exists and has content
    if (!dataFileContent) {
      console.error('❌ Unable to read data.ts file or file is empty.');
      process.exit(1);
    }
    
    console.log('📊 Analyzing data.ts file for product slugs...');
    
    // Find all product objects in the file using regex
    const productRegex = /{\s*id:\s*["']([^"']+)["'],\s*name:\s*["']([^"']+)["']([\s\S]*?)}/g;
    let match;
    let updatedCount = 0;
    let alreadyStandardizedCount = 0;
    
    // Keep track of all updates for reporting
    const updates = [];
    
    // Update all product slugs
    const updatedContent = dataFileContent.replace(productRegex, (fullMatch, id, name, productProps) => {
      // Generate the standard slug for this product
      const standardSlug = createStandardSlug(name);
      
      // Check if there's an existing url_slug property
      const slugMatch = productProps.match(/url_slug:\s*["']([^"']+)["']/);
      
      if (slugMatch) {
        const currentSlug = slugMatch[1];
        
        if (currentSlug === standardSlug) {
          alreadyStandardizedCount++;
          console.log(`✅ Product "${name}" already has standardized slug: ${currentSlug}`);
          return fullMatch; // No change needed
        }
        
        // Update the existing url_slug property
        updatedCount++;
        const updatedProps = productProps.replace(
          /url_slug:\s*["']([^"']+)["']/,
          `url_slug: "${standardSlug}"`
        );
        
        updates.push({
          name,
          oldSlug: currentSlug,
          newSlug: standardSlug
        });
        
        return `{ id: "${id}", name: "${name}"${updatedProps} }`;
      } else {
        // Add url_slug property if it doesn't exist
        updatedCount++;
        
        // Find the last property in the object
        const lastPropMatch = productProps.match(/(\s+\w+):\s*([^,]+),?\s*$/);
        
        if (lastPropMatch) {
          const updatedProps = productProps.replace(
            lastPropMatch[0],
            `${lastPropMatch[0]},\n  url_slug: "${standardSlug}"`
          );
          
          updates.push({
            name,
            oldSlug: "none",
            newSlug: standardSlug
          });
          
          return `{ id: "${id}", name: "${name}"${updatedProps} }`;
        } else {
          // Couldn't identify the structure, append at the end
          const updatedProps = `${productProps},\n  url_slug: "${standardSlug}"`;
          
          updates.push({
            name,
            oldSlug: "none",
            newSlug: standardSlug
          });
          
          return `{ id: "${id}", name: "${name}"${updatedProps} }`;
        }
      }
    });
    
    // Write the updated content back to the file
    fs.writeFileSync(DATA_FILE_PATH, updatedContent, 'utf8');
    
    // Print report
    console.log('\n📋 Standardization Report:');
    console.log(`🆕 Updated: ${updatedCount} products`);
    console.log(`🟢 Already standardized: ${alreadyStandardizedCount} products`);
    console.log(`🔄 Total processed: ${updatedCount + alreadyStandardizedCount} products\n`);
    
    if (updates.length > 0) {
      console.log('📝 Slug updates:');
      updates.forEach(update => {
        console.log(`- "${update.name}": ${update.oldSlug} → ${update.newSlug}`);
      });
    }
    
    console.log('\n✅ Product slug standardization completed successfully!');
    console.log('🔄 Please restart your Next.js server to apply changes.');
    
  } catch (error) {
    console.error('❌ Error standardizing product slugs:', error);
    process.exit(1);
  }
}

// Execute the main function
standardizeProductSlugs(); 
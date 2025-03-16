#!/usr/bin/env node

/**
 * Fix Vote Counts Script
 * 
 * This script recalculates vote counts for all products in the database
 * by counting the actual votes in the votes table and updating the
 * upvotes, downvotes, and score fields in the products table.
 * 
 * Usage:
 *   node scripts/fix-vote-counts.js
 * 
 * Options:
 *   --dry-run    Show what would be updated without making changes
 *   --product-id=<id> Only fix a specific product by ID
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const productIdArg = args.find(arg => arg.startsWith('--product-id='));
const specificProductId = productIdArg ? productIdArg.split('=')[1] : null;

async function main() {
  console.log('🔧 Vote Count Fixer');
  console.log('====================');
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE: No changes will be made');
  }
  
  if (specificProductId) {
    console.log(`🎯 Fixing only product ID: ${specificProductId}`);
  }
  
  try {
    // Get all products or a specific product
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, upvotes, downvotes, score')
      .order('id')
      .conditionalFilter(specificProductId, query => 
        query.eq('id', specificProductId)
      );
    
    if (productsError) {
      throw new Error(`Error fetching products: ${productsError.message}`);
    }
    
    console.log(`📊 Found ${products.length} products to process`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    // Process each product
    for (const product of products) {
      try {
        // Get upvotes count
        const { count: upvotesCount, error: upvotesError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', product.id)
          .eq('vote_type', 1);
        
        if (upvotesError) {
          throw new Error(`Error counting upvotes: ${upvotesError.message}`);
        }
        
        // Get downvotes count
        const { count: downvotesCount, error: downvotesError } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('product_id', product.id)
          .eq('vote_type', -1);
        
        if (downvotesError) {
          throw new Error(`Error counting downvotes: ${downvotesError.message}`);
        }
        
        // Calculate score
        const score = upvotesCount - downvotesCount;
        
        // Check if counts are different from stored values
        const needsUpdate = 
          product.upvotes !== upvotesCount || 
          product.downvotes !== downvotesCount || 
          product.score !== score;
        
        if (needsUpdate) {
          console.log(`\n📝 Product: ${product.name} (${product.id})`);
          console.log(`   Current: ⬆️ ${product.upvotes} | ⬇️ ${product.downvotes} | Score: ${product.score}`);
          console.log(`   Actual:  ⬆️ ${upvotesCount} | ⬇️ ${downvotesCount} | Score: ${score}`);
          
          if (!dryRun) {
            // Update the product with correct counts
            const { error: updateError } = await supabase
              .from('products')
              .update({
                upvotes: upvotesCount,
                downvotes: downvotesCount,
                score: score
              })
              .eq('id', product.id);
            
            if (updateError) {
              throw new Error(`Error updating product: ${updateError.message}`);
            }
            
            console.log('   ✅ Updated successfully');
            updatedCount++;
          } else {
            console.log('   🔍 Would update (dry run)');
            updatedCount++;
          }
        } else {
          process.stdout.write('.');
        }
      } catch (error) {
        console.error(`\n❌ Error processing product ${product.id}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n\n📊 Summary:');
    console.log(`   Total products: ${products.length}`);
    console.log(`   Products needing updates: ${updatedCount}`);
    console.log(`   Errors: ${errorCount}`);
    
    if (dryRun && updatedCount > 0) {
      console.log('\n💡 Run without --dry-run to apply these changes');
    }
    
  } catch (error) {
    console.error(`\n❌ Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main(); 
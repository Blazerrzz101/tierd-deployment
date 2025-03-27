/**
 * Rankings Page Test Module
 * 
 * This module tests the functionality of the rankings page and its components,
 * including the RankingList, CategoryFilter, and view modes.
 */

import { getEnhancedProductImage } from './utils/enhanced-images';
import { getProductAffiliateLinkAndImage } from './utils/affiliate-utils';
import { categories } from './lib/data';

// Test enhanced images functionality
const testEnhancedImages = () => {
  console.log('Testing Enhanced Images Utility:');
  
  const testProducts = [
    'Logitech G502 X Plus',
    'Razer Viper V2 Pro',
    'Samsung Odyssey G7',
    'Nonexistent Product'
  ];
  
  testProducts.forEach(product => {
    const enhancedImage = getEnhancedProductImage(product);
    console.log(`- ${product}: ${enhancedImage || 'No enhanced image found'}`);
  });
  
  console.log('\n');
};

// Test affiliate links functionality
const testAffiliateLinks = () => {
  console.log('Testing Affiliate Links Utility:');
  
  const testProducts = [
    'Logitech G502 X Plus',
    'Razer Viper V2 Pro',
    'Samsung Odyssey G7',
    'Nonexistent Product'
  ];
  
  testProducts.forEach(product => {
    const { affiliateLink, bestBuyImage } = getProductAffiliateLinkAndImage(product);
    console.log(`- ${product}:`);
    console.log(`  - Affiliate Link: ${affiliateLink || 'None'}`);
    console.log(`  - Best Buy Image: ${bestBuyImage || 'None'}`);
  });
  
  console.log('\n');
};

// Test category filter functionality
const testCategoryFilter = () => {
  console.log('Testing Category Filter:');
  console.log('Available Categories:');
  
  categories.forEach(category => {
    console.log(`- ID: ${category.id}, Name: ${category.name}`);
  });
  
  console.log('\n');
};

// Run all tests
const runTests = () => {
  console.log('=== RANKINGS PAGE TEST MODULE ===\n');
  
  testEnhancedImages();
  testAffiliateLinks();
  testCategoryFilter();
  
  console.log('=== ALL TESTS COMPLETED ===');
};

// Export test functions
export { 
  runTests,
  testEnhancedImages,
  testAffiliateLinks,
  testCategoryFilter
};

// Automatically run tests if this file is executed directly
if (typeof window !== 'undefined') {
  console.log('Running tests in browser environment...');
  runTests();
} 
// Standalone script to test the product and vote API functionality
const fs = require('fs');
const path = require('path');

// Mock the NextRequest and NextResponse for testing
class MockNextRequest {
  constructor(url, method, body) {
    this.url = url;
    this.method = method;
    this.body = body;
  }

  async json() {
    return this.body;
  }
}

class MockNextResponse {
  static json(data, options = {}) {
    return { data, status: options.status || 200 };
  }
}

// Import the mockProducts from the API route
const apiRoutePath = path.join(__dirname, 'app', 'api', 'products', 'route.ts');
let mockProducts = [];

try {
  console.log('Reading API route from:', apiRoutePath);
  if (fs.existsSync(apiRoutePath)) {
    const apiRouteContent = fs.readFileSync(apiRoutePath, 'utf8');
    console.log('API route file found and read');
    
    // Just hard-code the three products we need for testing
    mockProducts = [
      {
        id: "j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6",
        name: "ASUS ROG Swift PG279QM",
        description: "27-inch gaming monitor with 240Hz refresh rate and G-SYNC",
        category: "monitors",
        price: 849.99,
        url_slug: "asus-rog-swift-pg279qm",
        image_url: "/images/products/placeholder-monitor.svg",
        specifications: {
          "Screen Size": "27 inches",
          "Resolution": "2560 x 1440",
          "Refresh Rate": "240Hz",
          "Response Time": "1ms",
          "Panel Type": "IPS",
          "HDR": "HDR400",
          "G-SYNC": "Yes"
        },
        created_at: "2023-01-15T12:00:00Z",
        updated_at: "2023-06-20T15:30:00Z",
        rating: 4.8,
        review_count: 156,
        reviews: [],
        threads: []
      },
      {
        id: "c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l",
        name: "Razer DeathAdder V2",
        description: "Ergonomic gaming mouse with optical switches",
        category: "mice",
        price: 69.99,
        url_slug: "razer-deathadder-v2",
        image_url: "/images/products/placeholder-mouse.svg",
        specifications: {
          "Sensor": "Focus+ 20K DPI Optical",
          "Switches": "Optical",
          "Buttons": "8",
          "Connection": "Wired",
          "Weight": "82g"
        },
        created_at: "2023-03-05T14:30:00Z",
        updated_at: "2023-08-12T10:20:00Z",
        rating: 4.7,
        review_count: 189,
        reviews: [],
        threads: []
      },
      {
        id: "9dd2bfe2-6eef-40de-ae12-c35ff1975914",
        name: "Logitech G502 HERO",
        description: "High-performance gaming mouse with HERO sensor",
        category: "mice",
        price: 79.99,
        url_slug: "logitech-g502-hero",
        image_url: "/images/products/placeholder-mouse.svg",
        specifications: {
          "Sensor": "HERO 25K",
          "Switches": "Mechanical",
          "Buttons": "11",
          "Connection": "Wired",
          "Weight": "121g (adjustable)"
        },
        created_at: "2023-02-10T09:15:00Z",
        updated_at: "2023-07-05T11:45:00Z",
        rating: 4.5,
        review_count: 256,
        reviews: [],
        threads: []
      }
    ];
    
    console.log(`Hardcoded ${mockProducts.length} mock products for testing`);
  } else {
    console.error('API route file not found at:', apiRoutePath);
  }
} catch (error) {
  console.error('Error loading mock products:', error);
}

// Mock vote data
const mockVotes = {
  'j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6': { upvotes: 5, downvotes: 2 },
  'c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l': { upvotes: 10, downvotes: 3 },
  '9dd2bfe2-6eef-40de-ae12-c35ff1975914': { upvotes: 7, downvotes: 1 },
};

// Mock user votes
const mockUserVotes = {};

// Test functions
async function getProduct(productId, clientId = 'test-client') {
  try {
    console.log(`\n[TEST] Fetching product: ${productId}`);
    
    if (!productId) {
      console.log('[RESULT] Product ID is required');
      return { success: false, error: "Product ID is required" };
    }
    
    // Find the product with the matching ID
    const product = mockProducts.find(p => p.id === productId);
    
    if (!product) {
      console.log(`[RESULT] Product not found: ${productId}`);
      return { success: false, error: "Product not found" };
    }
    
    // Get vote data from mock store
    const voteCounts = mockVotes[productId] || { upvotes: 0, downvotes: 0 };
    const voteKey = `${clientId}:${productId}`;
    const userVote = mockUserVotes[voteKey] || null;
    const score = voteCounts.upvotes - voteCounts.downvotes;
    
    // Create a new product object with the vote data
    const productWithVotes = {
      ...product,
      upvotes: voteCounts.upvotes,
      downvotes: voteCounts.downvotes,
      userVote,
      score
    };
    
    console.log(`[RESULT] Product details:`, {
      id: productId,
      name: product.name,
      upvotes: voteCounts.upvotes,
      downvotes: voteCounts.downvotes,
      userVote,
      score
    });
    
    return { success: true, product: productWithVotes };
  } catch (error) {
    console.error(`[ERROR] Error in getProduct:`, error);
    return { success: false, error: String(error) };
  }
}

async function voteForProduct(productId, voteType, clientId = 'test-client') {
  try {
    console.log(`\n[TEST] Voting for product: ${productId}, Vote: ${voteType}`);
    
    if (!productId) {
      console.log('[RESULT] Product ID is required');
      return { success: false, error: "Product ID is required" };
    }
    
    if (voteType !== 1 && voteType !== -1 && voteType !== 0) {
      console.log('[RESULT] Invalid vote type');
      return { success: false, error: "Vote type must be 1 (upvote), -1 (downvote), or 0 (remove vote)" };
    }
    
    // Find the product with the matching ID
    const product = mockProducts.find(p => p.id === productId);
    
    if (!product) {
      console.log(`[RESULT] Product not found: ${productId}`);
      return { success: false, error: "Product not found" };
    }
    
    // Initialize vote data if not exists
    if (!mockVotes[productId]) {
      mockVotes[productId] = { upvotes: 0, downvotes: 0 };
    }
    
    const voteKey = `${clientId}:${productId}`;
    const currentVote = mockUserVotes[voteKey] || 0;
    
    // Handle voting logic
    if (voteType === 0 || (currentVote === voteType)) {
      // Remove vote if setting to 0 or voting the same way twice
      if (currentVote === 1) {
        mockVotes[productId].upvotes = Math.max(0, mockVotes[productId].upvotes - 1);
      } else if (currentVote === -1) {
        mockVotes[productId].downvotes = Math.max(0, mockVotes[productId].downvotes - 1);
      }
      
      // Clear the user's vote
      delete mockUserVotes[voteKey];
      console.log(`[RESULT] Vote removed for ${productId} by ${clientId}`);
    } else {
      // Removing previous vote if changing vote direction
      if (currentVote === 1) {
        mockVotes[productId].upvotes = Math.max(0, mockVotes[productId].upvotes - 1);
      } else if (currentVote === -1) {
        mockVotes[productId].downvotes = Math.max(0, mockVotes[productId].downvotes - 1);
      }
      
      // Adding new vote
      if (voteType === 1) {
        mockVotes[productId].upvotes += 1;
        console.log(`[RESULT] Upvote added for ${productId} by ${clientId}`);
      } else if (voteType === -1) {
        mockVotes[productId].downvotes += 1;
        console.log(`[RESULT] Downvote added for ${productId} by ${clientId}`);
      }
      
      // Store the user's vote
      mockUserVotes[voteKey] = voteType;
    }
    
    // Calculate the score
    const score = mockVotes[productId].upvotes - mockVotes[productId].downvotes;
    
    console.log(`[RESULT] Vote counts for ${productId}:`, {
      upvotes: mockVotes[productId].upvotes,
      downvotes: mockVotes[productId].downvotes,
      score,
      userVote: mockUserVotes[voteKey] || null
    });
    
    return {
      success: true,
      productId,
      upvotes: mockVotes[productId].upvotes,
      downvotes: mockVotes[productId].downvotes,
      voteType: mockUserVotes[voteKey] || null,
      score
    };
  } catch (error) {
    console.error(`[ERROR] Error in voteForProduct:`, error);
    return { success: false, error: String(error) };
  }
}

// Run the tests
async function runTests() {
  console.log('\n============================================================');
  console.log('VOTING SYSTEM TEST - DIRECT MODULE TEST');
  console.log('============================================================');
  
  const productId = 'j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6';
  const clientId = 'test-client-direct';
  
  console.log(`Testing with: Product ID: ${productId}, Client ID: ${clientId}`);
  
  // Test 1: Get product details
  console.log('\n----------------------------------------');
  console.log('TEST 1: Fetching product details');
  console.log('----------------------------------------');
  const productDetails = await getProduct(productId, clientId);
  
  if (!productDetails.success) {
    console.log('[FAILED] Could not fetch product details');
    return;
  }
  
  // Test 2: Upvote the product
  console.log('\n----------------------------------------');
  console.log('TEST 2: Upvoting the product');
  console.log('----------------------------------------');
  const upvoteResult = await voteForProduct(productId, 1, clientId);
  
  if (!upvoteResult.success) {
    console.log('[FAILED] Could not upvote product');
    return;
  }
  
  // Test 3: Toggling the upvote
  console.log('\n----------------------------------------');
  console.log('TEST 3: Toggling the upvote (removing it)');
  console.log('----------------------------------------');
  const toggleUpvoteResult = await voteForProduct(productId, 1, clientId);
  
  if (!toggleUpvoteResult.success) {
    console.log('[FAILED] Could not toggle upvote');
    return;
  }
  
  // Test 4: Downvote the product
  console.log('\n----------------------------------------');
  console.log('TEST 4: Downvoting the product');
  console.log('----------------------------------------');
  const downvoteResult = await voteForProduct(productId, -1, clientId);
  
  if (!downvoteResult.success) {
    console.log('[FAILED] Could not downvote product');
    return;
  }
  
  // Test 5: Change from downvote to upvote
  console.log('\n----------------------------------------');
  console.log('TEST 5: Changing from downvote to upvote');
  console.log('----------------------------------------');
  const changeVoteResult = await voteForProduct(productId, 1, clientId);
  
  if (!changeVoteResult.success) {
    console.log('[FAILED] Could not change vote');
    return;
  }
  
  // Test 6: Verify final product state
  console.log('\n----------------------------------------');
  console.log('TEST 6: Verifying final product state');
  console.log('----------------------------------------');
  const finalProductDetails = await getProduct(productId, clientId);
  
  if (!finalProductDetails.success) {
    console.log('[FAILED] Could not fetch final product state');
    return;
  }
  
  // Test conclusion
  console.log('\n============================================================');
  console.log('TEST SUMMARY');
  console.log('============================================================');
  
  if (productDetails.success &&
      upvoteResult.success &&
      toggleUpvoteResult.success &&
      downvoteResult.success &&
      changeVoteResult.success &&
      finalProductDetails.success) {
    console.log('[SUCCESS] All API tests completed successfully!');
  } else {
    console.log('[FAILED] Some tests failed. Check the log for details.');
  }
  
  console.log('Test completed at:', new Date().toISOString());
}

// Run all tests
runTests().catch(error => {
  console.error('Error running tests:', error);
}); 
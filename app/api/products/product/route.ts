import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Import mockProducts from the products route
import { mockProducts } from '../route';

// Mock vote data - make it exportable
export const mockVotes: Record<string, { upvotes: number; downvotes: number }> = {
  'j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6': { upvotes: 5, downvotes: 2 },
  'c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l': { upvotes: 10, downvotes: 3 },
  '9dd2bfe2-6eef-40de-ae12-c35ff1975914': { upvotes: 7, downvotes: 1 },
  'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6': { upvotes: 12, downvotes: 2 },
  'q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6': { upvotes: 8, downvotes: 4 },
  'z1x2c3v4-b5n6-m7k8-j9h0-g1f2d3s4a5': { upvotes: 6, downvotes: 0 },
  'p9o8i7u6-y5t4-r3e2-w1q0-z9x8c7v6b5': { upvotes: 9, downvotes: 5 },
  'n4m3b2v1-c8x7z6-p5o4i3-u2y1t0-r9e8w7q6': { upvotes: 4, downvotes: 1 },
  'l5k4j3h2-g1f0d9-s8a7p6-o5i4u3-y2t1r0e9': { upvotes: 3, downvotes: 3 },
  'w9q8e7r6-t5y4u3-i2o1p0-a9s8d7-f6g5h4j3': { upvotes: 11, downvotes: 6 }
};

// Mock user votes - make it exportable
export const mockUserVotes: Record<string, number> = {};

// Vote validation schema
type VoteRequest = {
  productId: string;
  voteType: number; // 1 for upvote, -1 for downvote
  clientId: string;
};

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/products/product");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const clientId = searchParams.get("clientId") || 'anonymous';

    if (!id) {
      console.log("Product ID is required");
      return NextResponse.json({ success: false, error: "Product ID is required" }, { status: 400 });
    }

    // Find the product with the matching ID
    const product = mockProducts.find(p => p.id === id);

    if (!product) {
      console.log(`Product not found: ${id}`);
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // Get vote data from mock store
    const voteCounts = mockVotes[id] || { upvotes: 0, downvotes: 0 };
    const voteKey = `${clientId}:${id}`;
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

    console.log(`Returning product details for: ${id}, client: ${clientId}`);
    return NextResponse.json({ success: true, product: productWithVotes });
  } catch (error) {
    console.error("Error in GET /api/products/product:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/products/product called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request body
    const { productId, voteType, clientId = 'anonymous' } = body as VoteRequest;
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }
    
    if (voteType !== 1 && voteType !== -1 && voteType !== 0) {
      return NextResponse.json(
        { success: false, error: "Vote type must be 1 (upvote), -1 (downvote), or 0 (remove vote)" },
        { status: 400 }
      );
    }
    
    // Find the product with the matching ID
    const product = mockProducts.find((p: any) => p.id === productId);
    
    if (!product) {
      console.log(`Product not found: ${productId}`);
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
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
      console.log(`Vote removed for ${productId} by ${clientId}`);
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
        console.log(`Upvote added for ${productId} by ${clientId}`);
      } else if (voteType === -1) {
        mockVotes[productId].downvotes += 1;
        console.log(`Downvote added for ${productId} by ${clientId}`);
      }
      
      // Store the user's vote
      mockUserVotes[voteKey] = voteType;
    }
    
    // Calculate the score
    const score = mockVotes[productId].upvotes - mockVotes[productId].downvotes;
    
    console.log(`Vote counts for ${productId}:`, {
      upvotes: mockVotes[productId].upvotes,
      downvotes: mockVotes[productId].downvotes,
      score
    });
    
    return NextResponse.json({
      success: true,
      productId,
      upvotes: mockVotes[productId].upvotes,
      downvotes: mockVotes[productId].downvotes,
      voteType: mockUserVotes[voteKey] || null,
      score
    });
  } catch (error) {
    console.error(`Error in POST /api/products/product:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to update vote", message: String(error) },
      { status: 500 }
    );
  }
} 
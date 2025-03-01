import { NextRequest, NextResponse } from 'next/server';

// Import the mockVotes and mockUserVotes from the product API to ensure consistency
import { mockProducts } from '../products/route';
import { mockVotes, mockUserVotes } from '../products/product/route';

// Helper to calculate score
function calculateScore(upvotes: number, downvotes: number): number {
  return upvotes - downvotes;
}

// Check if a vote is valid
function isValidVoteType(voteType: any): voteType is 1 | -1 | 0 {
  return voteType === 1 || voteType === -1 || voteType === 0;
}

// Get current vote status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clientId = searchParams.get('clientId');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }

    // Get the vote key for this client and product
    const voteKey = `${clientId}:${productId}`;
    const voteType = mockUserVotes[voteKey] || null;
    
    // Get vote counts or initialize if not exists
    if (!mockVotes[productId]) {
      mockVotes[productId] = { upvotes: 0, downvotes: 0 };
    }
    
    const { upvotes, downvotes } = mockVotes[productId];
    const score = calculateScore(upvotes, downvotes);

    console.log(`Vote status for product ${productId}, client ${clientId}: type=${voteType}, upvotes=${upvotes}, downvotes=${downvotes}`);

    return NextResponse.json({
      success: true,
      productId,
      voteType,
      upvotes,
      downvotes,
      score
    });
  } catch (error) {
    console.error('Error getting vote status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get vote status' },
      { status: 500 }
    );
  }
}

// Handle voting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, clientId, voteType } = body;

    // Validate input parameters
    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required' }, { status: 400 });
    }
    
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Client ID is required' }, { status: 400 });
    }
    
    if (!isValidVoteType(voteType)) {
      return NextResponse.json({ success: false, error: 'Invalid vote type' }, { status: 400 });
    }

    // Initialize vote counts if needed
    if (!mockVotes[productId]) {
      mockVotes[productId] = { upvotes: 0, downvotes: 0 };
    }

    // Get the vote key for this client and product
    const voteKey = `${clientId}:${productId}`;
    const currentVote = mockUserVotes[voteKey];
    const { upvotes, downvotes } = mockVotes[productId];
    
    console.log(`Processing vote: product=${productId}, client=${clientId}, voteType=${voteType}, currentVote=${currentVote}`);

    // Remove existing vote if present
    if (currentVote) {
      if (currentVote === 1) {
        mockVotes[productId].upvotes = Math.max(0, upvotes - 1);
      } else if (currentVote === -1) {
        mockVotes[productId].downvotes = Math.max(0, downvotes - 1);
      }
    }

    // Handle vote toggling (voting the same way twice)
    if (currentVote === voteType) {
      // Remove the vote
      delete mockUserVotes[voteKey];
      console.log(`Vote removed for ${productId} by ${clientId}`);
      
      const updatedCounts = mockVotes[productId];
      const score = calculateScore(updatedCounts.upvotes, updatedCounts.downvotes);
      
      return NextResponse.json({
        success: true,
        message: 'Vote removed',
        productId,
        voteType: null,
        upvotes: updatedCounts.upvotes,
        downvotes: updatedCounts.downvotes,
        score
      });
    }

    // Add new vote
    mockUserVotes[voteKey] = voteType;
    
    // Update vote counts
    if (voteType === 1) {
      mockVotes[productId].upvotes++;
    } else if (voteType === -1) {
      mockVotes[productId].downvotes++;
    }

    const updatedCounts = mockVotes[productId];
    const score = calculateScore(updatedCounts.upvotes, updatedCounts.downvotes);
    
    console.log(`Vote recorded: ${voteType} for ${productId} by ${clientId}`);
    console.log(`New counts: upvotes=${updatedCounts.upvotes}, downvotes=${updatedCounts.downvotes}, score=${score}`);

    return NextResponse.json({
      success: true,
      message: voteType === 1 ? 'Upvoted' : 'Downvoted',
      productId,
      voteType,
      upvotes: updatedCounts.upvotes,
      downvotes: updatedCounts.downvotes,
      score
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process vote' },
      { status: 500 }
    );
  }
} 
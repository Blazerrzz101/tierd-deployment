import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { revalidateTag } from 'next/cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Store votes in memory for testing purposes
export const mockVotes = new Map();

// Initialize some default vote counts if they don't exist
export function ensureProductVoteCounts(productId: string) {
  if (!mockVotes.has(`${productId}:counts`)) {
    mockVotes.set(`${productId}:counts`, { upvotes: 5, downvotes: 2 });
  }
  return mockVotes.get(`${productId}:counts`);
}

/**
 * API endpoint to vote for a product
 * Accepts: productId, voteType, clientId
 */
export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { productId, voteType, clientId } = body;
    
    console.log('Vote API received request:', { productId, voteType, clientId });
    
    // Validate inputs
    if (!productId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing productId parameter' 
      }, { status: 400 });
    }
    
    if (voteType !== 1 && voteType !== -1) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid voteType, must be 1 or -1' 
      }, { status: 400 });
    }
    
    if (!clientId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing clientId parameter' 
      }, { status: 400 });
    }
    
    // For testing purposes, we'll simulate a vote operation with in-memory storage
    const voteKey = `${productId}:${clientId}`;
    const currentVote = mockVotes.get(voteKey);
    
    // Initialize product vote counts if not already tracked
    const counts = ensureProductVoteCounts(productId);
    let resultVoteType = voteType;
    
    // Handle vote toggling
    if (currentVote === voteType) {
      // User is voting the same way again, so remove the vote
      mockVotes.delete(voteKey);
      resultVoteType = null;
      
      // Update counts
      if (voteType === 1) {
        counts.upvotes = Math.max(0, counts.upvotes - 1);
      } else {
        counts.downvotes = Math.max(0, counts.downvotes - 1);
      }
    } else if (currentVote !== undefined) {
      // User is changing their vote
      mockVotes.set(voteKey, voteType);
      
      // Update counts
      if (voteType === 1) {
        counts.upvotes += 1;
        counts.downvotes = Math.max(0, counts.downvotes - 1);
      } else {
        counts.downvotes += 1;
        counts.upvotes = Math.max(0, counts.upvotes - 1);
      }
    } else {
      // New vote
      mockVotes.set(voteKey, voteType);
      
      // Update counts
      if (voteType === 1) {
        counts.upvotes += 1;
      } else {
        counts.downvotes += 1;
      }
    }
    
    // Update the counts in our mock storage
    mockVotes.set(`${productId}:counts`, counts);
    
    // Calculate score for ranking
    const score = counts.upvotes - counts.downvotes;
    mockVotes.set(`${productId}:score`, score);
    
    console.log('Vote processed:', { 
      productId, 
      clientId, 
      previousVote: currentVote, 
      newVote: resultVoteType,
      counts,
      score
    });
    
    // Return the updated vote information
    return NextResponse.json({
      success: true,
      result: {
        voteType: resultVoteType,
        upvotes: counts.upvotes,
        downvotes: counts.downvotes,
        score: score
      }
    });
  } catch (error) {
    console.error('Vote API error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * API to check if a user has voted for a product
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clientId = searchParams.get('clientId');
    const verbose = searchParams.get('verbose') === 'true';
    
    // Only log in verbose mode
    if (verbose) {
      console.log('Checking vote status for:', { productId, clientId });
    }
    
    if (!productId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing productId parameter' 
      }, { status: 400 });
    }
    
    if (!clientId) {
      return NextResponse.json({ 
        success: false,
        error: 'Missing clientId parameter' 
      }, { status: 400 });
    }
    
    // For testing purposes, use our in-memory mock storage
    const voteKey = `${productId}:${clientId}`;
    const userVote = mockVotes.get(voteKey);
    
    // Get vote counts
    const counts = ensureProductVoteCounts(productId);
    
    // Calculate score for ranking
    const score = counts.upvotes - counts.downvotes;
    
    return NextResponse.json({
      success: true,
      productId,
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      hasVoted: userVote !== undefined,
      voteType: userVote !== undefined ? userVote : null,
      score: score
    });
  } catch (error) {
    console.error('Vote check API error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
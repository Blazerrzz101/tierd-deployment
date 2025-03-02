import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

// Ensure Vote API is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Mock products import to maintain consistency
import { mockProducts } from '../products/route';

// Define interfaces for clarity
interface VoteCounts {
  upvotes: number;
  downvotes: number;
}

interface UserVote {
  productId: string;
  clientId: string;
  voteType: number;
  timestamp: string;
}

interface VoteState {
  votes: Record<string, number>; // key is clientId:productId
  voteCounts: Record<string, VoteCounts>;
  userVotes: UserVote[]; // history of votes for rate limiting
  lastUpdated: string;
}

// Path constants
const DATA_DIR = path.resolve(process.cwd(), 'data');
const VOTES_FILE = path.resolve(DATA_DIR, 'votes.json');

// Prepare consistent error and success response formats
const createErrorResponse = (message: string, status: number = 400) => {
  console.error(`Vote API Error: ${message}`);
  return NextResponse.json(
    { 
      success: false, 
      error: message,
      upvotes: 0,
      downvotes: 0,
      voteType: null,
      score: 0,
      hasVoted: false
    },
    { status }
  );
};

const createSuccessResponse = (data: any) => {
  // Ensure all expected properties are present
  const response = {
    success: true,
    productId: data.productId || null,
    voteType: data.voteType !== undefined ? data.voteType : null,
    upvotes: typeof data.upvotes === 'number' ? data.upvotes : 0,
    downvotes: typeof data.downvotes === 'number' ? data.downvotes : 0,
    score: typeof data.score === 'number' ? data.score : 0,
    hasVoted: !!data.hasVoted,
    message: data.message || '',
    ...data,
  };
  
  return NextResponse.json(response);
};

// Helper function to initialize vote state if it doesn't exist
async function initializeVoteState(): Promise<VoteState> {
  try {
    // Create data directory if it doesn't exist
    if (!existsSync(DATA_DIR)) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Initialize vote state if file doesn't exist
    if (!existsSync(VOTES_FILE)) {
      // Create initial state
      const initialState: VoteState = {
        votes: {},
        voteCounts: {},
        userVotes: [],
        lastUpdated: new Date().toISOString(),
      };

      // Initialize vote counts for mock products
      mockProducts.forEach(product => {
        initialState.voteCounts[product.id] = {
          upvotes: Math.floor(Math.random() * 10),
          downvotes: Math.floor(Math.random() * 5),
        };
      });

      // Write initial state to file
      await fs.writeFile(
        VOTES_FILE,
        JSON.stringify(initialState, null, 2),
        'utf8'
      );

      return initialState;
    }

    // Read existing file
    const data = await fs.readFile(VOTES_FILE, 'utf8');
    const state = JSON.parse(data) as VoteState;

    // Ensure userVotes array exists (for backward compatibility)
    if (!state.userVotes) {
      state.userVotes = [];
    }

    return state;
  } catch (error) {
    console.error('Error initializing vote state:', error);
    // Return empty state in case of error
    return {
      votes: {},
      voteCounts: {},
      userVotes: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Helper function to get vote state
async function getVoteState(): Promise<VoteState> {
  return await initializeVoteState();
}

// Helper function to save vote state
async function saveVoteState(state: VoteState): Promise<void> {
  try {
    // Ensure data directory exists
    if (!existsSync(DATA_DIR)) {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    // Update lastUpdated timestamp
    state.lastUpdated = new Date().toISOString();

    // Write state to file
    await fs.writeFile(VOTES_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving vote state:', error);
    throw error;
  }
}

// Helper function to calculate score
function calculateScore(upvotes: number, downvotes: number): number {
  return upvotes - downvotes;
}

// Helper function to check if user has reached rate limit
function hasReachedRateLimit(
  state: VoteState,
  clientId: string,
  userId?: string
): boolean {
  // Skip rate limiting for authenticated users
  if (userId) return false;

  // Get one hour ago timestamp
  const oneHourAgo = new Date();
  oneHourAgo.setHours(oneHourAgo.getHours() - 1);

  // Filter votes made by this client in the last hour
  const recentVotes = state.userVotes.filter(
    vote => 
      vote.clientId === clientId && 
      new Date(vote.timestamp) > oneHourAgo
  );

  return recentVotes.length >= 5;
}

// Helper function to add vote to history (for rate limiting)
function recordVote(state: VoteState, productId: string, clientId: string, voteType: number): void {
  state.userVotes.push({
    productId,
    clientId,
    voteType,
    timestamp: new Date().toISOString(),
  });

  // Limit history size to prevent excessive growth
  if (state.userVotes.length > 10000) {
    // Keep only the most recent 1000 votes
    state.userVotes = state.userVotes.slice(-1000);
  }
}

// Get vote status for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clientId = searchParams.get('clientId');
    
    // Validate parameters
    if (!productId) {
      return createErrorResponse('Product ID is required');
    }

    if (!clientId) {
      return createErrorResponse('Client ID is required');
    }

    // Get current vote state
    const state = await getVoteState();

    // Get vote counts for this product
    const voteCounts = state.voteCounts[productId] || { upvotes: 0, downvotes: 0 };
    
    // Get user's vote (if any)
    const voteKey = `${clientId}:${productId}`;
    const voteType = state.votes[voteKey] || null;
    
    // Calculate score
    const score = calculateScore(voteCounts.upvotes, voteCounts.downvotes);

    return createSuccessResponse({
      productId,
      voteType,
      upvotes: voteCounts.upvotes,
      downvotes: voteCounts.downvotes,
      score,
      hasVoted: voteType !== null,
    });
  } catch (error) {
    console.error('Error getting vote status:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to get vote status',
      500
    );
  }
}

// Handle vote submission
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, clientId, voteType } = body;
    let userId = body.userId || null; // Get userId if provided

    // Validate input parameters
    if (!productId) {
      return createErrorResponse('Product ID is required');
    }
    
    if (!clientId) {
      return createErrorResponse('Client ID is required');
    }
    
    if (voteType !== 1 && voteType !== -1) {
      return createErrorResponse('Invalid vote type (must be 1 or -1)');
    }

    // Get current vote state
    const state = await getVoteState();

    // Check rate limiting for anonymous users
    if (hasReachedRateLimit(state, clientId, userId)) {
      return createErrorResponse(
        'Rate limit exceeded (5 votes per hour). Please sign in to vote more.',
        429
      );
    }

    // Initialize vote counts for this product if needed
    if (!state.voteCounts[productId]) {
      state.voteCounts[productId] = { upvotes: 0, downvotes: 0 };
    }

    // Get the vote key for this client and product
    const voteKey = `${clientId}:${productId}`;
    const currentVote = state.votes[voteKey];
    
    console.log(`Processing vote: product=${productId}, client=${clientId}, voteType=${voteType}, currentVote=${currentVote}`);

    // Remove existing vote if present
    if (currentVote) {
      if (currentVote === 1) {
        state.voteCounts[productId].upvotes = Math.max(0, state.voteCounts[productId].upvotes - 1);
      } else if (currentVote === -1) {
        state.voteCounts[productId].downvotes = Math.max(0, state.voteCounts[productId].downvotes - 1);
      }
    }

    // Handle vote toggling (voting the same way twice)
    if (currentVote === voteType) {
      // Remove the vote
      delete state.votes[voteKey];
      console.log(`Vote removed for ${productId} by ${clientId}`);
      
      // Record the vote action for rate limiting
      recordVote(state, productId, clientId, 0); // 0 indicates vote removal
      
      // Save updated state
      await saveVoteState(state);
      
      const updatedCounts = state.voteCounts[productId];
      const score = calculateScore(updatedCounts.upvotes, updatedCounts.downvotes);
      
      return createSuccessResponse({
        message: 'Vote removed',
        productId,
        voteType: null,
        upvotes: updatedCounts.upvotes,
        downvotes: updatedCounts.downvotes,
        score,
        hasVoted: false
      });
    }

    // Add new vote
    state.votes[voteKey] = voteType;
    
    // Update vote counts
    if (voteType === 1) {
      state.voteCounts[productId].upvotes++;
    } else if (voteType === -1) {
      state.voteCounts[productId].downvotes++;
    }

    // Record the vote action for rate limiting
    recordVote(state, productId, clientId, voteType);
    
    // Save updated state
    await saveVoteState(state);

    const updatedCounts = state.voteCounts[productId];
    const score = calculateScore(updatedCounts.upvotes, updatedCounts.downvotes);
    
    console.log(`Vote recorded: ${voteType} for ${productId} by ${clientId}`);
    console.log(`New counts: upvotes=${updatedCounts.upvotes}, downvotes=${updatedCounts.downvotes}, score=${score}`);

    return createSuccessResponse({
      message: voteType === 1 ? 'Upvoted' : 'Downvoted',
      productId,
      voteType,
      upvotes: updatedCounts.upvotes,
      downvotes: updatedCounts.downvotes,
      score,
      hasVoted: true
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    return createErrorResponse(
      error instanceof Error ? error.message : 'Failed to process vote',
      500
    );
  }
} 
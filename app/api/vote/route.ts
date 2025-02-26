import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import fs from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface VoteCounts {
  upvotes: number;
  downvotes: number;
}

interface VoteState {
  votes: Record<string, number>;
  voteCounts: Record<string, VoteCounts>;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const VOTE_FILE = path.join(DATA_DIR, 'votes.json');

// Ensure the data directory exists
try {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (error) {
  console.error('Error creating data directory:', error);
}

// Initialize or load vote state with retries
async function getVoteState(retries = 3): Promise<VoteState> {
  for (let i = 0; i < retries; i++) {
    try {
      if (existsSync(VOTE_FILE)) {
        const data = await fs.readFile(VOTE_FILE, 'utf8');
        const state = JSON.parse(data);
        return {
          votes: state.votes || {},
          voteCounts: state.voteCounts || {},
          lastUpdated: state.lastUpdated || new Date().toISOString()
        };
      }
    } catch (error) {
      console.error(`Error reading vote state (attempt ${i + 1}):`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i))); // Exponential backoff
    }
  }
  return { votes: {}, voteCounts: {}, lastUpdated: new Date().toISOString() };
}

// Save vote state with retries
async function saveVoteState(state: VoteState, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      state.lastUpdated = new Date().toISOString();
      await fs.writeFile(VOTE_FILE, JSON.stringify(state, null, 2), {
        encoding: 'utf8',
        flag: 'w'
      });
      return;
    } catch (error) {
      console.error(`Error saving vote state (attempt ${i + 1}):`, error);
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i))); // Exponential backoff
    }
  }
}

// Initialize some default vote counts if they don't exist
async function ensureProductVoteCounts(productId: string, state: VoteState): Promise<VoteCounts> {
  if (!state.voteCounts[productId]) {
    state.voteCounts[productId] = { upvotes: 5, downvotes: 2 };
    await saveVoteState(state);
  }
  return state.voteCounts[productId];
}

// Validate vote request
const voteSchema = z.object({
  productId: z.string(),
  voteType: z.union([z.literal(1), z.literal(-1)], {
    invalid_type_error: 'Vote type must be 1 or -1',
  }),
  clientId: z.string()
});

/**
 * API endpoint to vote for a product
 * Accepts: productId, voteType, clientId
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, voteType, clientId } = voteSchema.parse(body);

    // Load current state
    const state = await getVoteState();
    
    // Get current vote counts
    const counts = await ensureProductVoteCounts(productId, state);
    
    // Get current user's vote
    const voteKey = `${productId}:${clientId}`;
    const currentVote = state.votes[voteKey];

    // Calculate new vote counts
    const newCounts: VoteCounts = {
      upvotes: counts.upvotes,
      downvotes: counts.downvotes
    };
    
    // Remove old vote if it exists
    if (currentVote === 1) {
      newCounts.upvotes--;
    } else if (currentVote === -1) {
      newCounts.downvotes--;
    }

    // If voting the same way, remove the vote
    if (currentVote === voteType) {
      delete state.votes[voteKey];
      console.log(`Removed vote for product ${productId} by client ${clientId}`);
    } else {
      // Add new vote
      state.votes[voteKey] = voteType;
      if (voteType === 1) {
        newCounts.upvotes++;
      } else {
        newCounts.downvotes++;
      }
      console.log(`Recorded ${voteType === 1 ? 'upvote' : 'downvote'} for product ${productId} by client ${clientId}`);
    }

    // Update vote counts
    state.voteCounts[productId] = newCounts;

    // Save state
    await saveVoteState(state);

    // Log the current state for debugging
    console.log('Vote state updated:', {
      productId,
      clientId,
      voteType,
      currentVote,
      newCounts,
      totalVotes: Object.keys(state.votes).length,
      totalProducts: Object.keys(state.voteCounts).length,
      lastUpdated: state.lastUpdated
    });

    return NextResponse.json({
      success: true,
      result: {
        voteType: currentVote === voteType ? null : voteType,
        upvotes: newCounts.upvotes,
        downvotes: newCounts.downvotes,
        score: newCounts.upvotes - newCounts.downvotes
      },
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to vote',
      },
      { status: 500 }
    );
  }
}

/**
 * API to check if a user has voted for a product
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clientId = searchParams.get('clientId');

    if (!productId || !clientId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Load current state
    const state = await getVoteState();
    
    // Get vote counts and user's vote
    const counts = await ensureProductVoteCounts(productId, state);
    const voteKey = `${productId}:${clientId}`;
    const userVote = state.votes[voteKey];

    // Log the current state for debugging
    console.log('Vote status check:', {
      productId,
      clientId,
      userVote,
      counts,
      totalVotes: Object.keys(state.votes).length,
      totalProducts: Object.keys(state.voteCounts).length,
      lastUpdated: state.lastUpdated
    });

    return NextResponse.json({
      success: true,
      voteType: userVote || null,
      upvotes: counts.upvotes,
      downvotes: counts.downvotes,
      score: counts.upvotes - counts.downvotes,
    });
  } catch (error) {
    console.error('Vote status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get vote status',
      },
      { status: 500 }
    );
  }
} 
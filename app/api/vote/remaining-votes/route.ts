import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from 'fs';
import { existsSync } from 'fs';
import path from 'path';

// Ensure API is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Path for storing votes
const DATA_DIR = path.join(process.cwd(), 'data');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');

// Maximum allowed votes for anonymous users
const MAX_ANONYMOUS_VOTES = 5;

// Vote state type definition
interface VoteState {
  votes: Record<string, number>;
  voteCounts: Record<string, { upvotes: number; downvotes: number }>;
  userVotes: Array<{
    productId: string;
    clientId: string;
    voteType: number;
    timestamp: string;
  }>;
  lastUpdated: string;
}

// Get vote state from file
async function getVoteState(): Promise<VoteState> {
  try {
    // Check if data dir exists, create if not
    if (!existsSync(DATA_DIR)) {
      console.log(`Creating data directory at ${DATA_DIR}`);
      await fs.mkdir(DATA_DIR, { recursive: true });
    }
    
    if (!existsSync(VOTES_FILE)) {
      console.log(`Vote state file not found at ${VOTES_FILE}, initializing empty state`);
      return {
        votes: {},
        voteCounts: {},
        userVotes: [],
        lastUpdated: new Date().toISOString(),
      };
    }

    console.log(`Reading vote state from: ${VOTES_FILE}`);
    const data = await fs.readFile(VOTES_FILE, 'utf8');
    const state = JSON.parse(data) as VoteState;
    
    console.log(`Successfully read vote state: ${JSON.stringify(state, null, 2)}`);
    return state;
  } catch (error) {
    console.error('Error reading vote state:', error);
    return {
      votes: {},
      voteCounts: {},
      userVotes: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

// Prepare consistent error and success response formats
const createErrorResponse = (message: string, status: number = 400) => {
  console.error(`Remaining Votes API Error: ${message}`);
  return NextResponse.json(
    { 
      success: false, 
      error: message,
      remainingVotes: 0,
      maxVotes: MAX_ANONYMOUS_VOTES,
      votesUsed: 0
    },
    { status }
  );
};

const createSuccessResponse = (data: any) => {
  // Ensure all expected properties are present
  const response = {
    success: true,
    remainingVotes: typeof data.remainingVotes === 'number' ? data.remainingVotes : 0,
    maxVotes: typeof data.maxVotes === 'number' ? data.maxVotes : MAX_ANONYMOUS_VOTES,
    votesUsed: typeof data.votesUsed === 'number' ? data.votesUsed : 0,
    ...data,
  };
  
  return NextResponse.json(response);
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return createErrorResponse("Client ID is required");
    }

    // Get the vote state to count active votes
    const state = await getVoteState();
    
    // Count active votes for this client
    const clientVotes = Object.keys(state.votes)
      .filter(key => key.startsWith(clientId + ':'))
      .length;
    
    const remainingVotes = Math.max(0, MAX_ANONYMOUS_VOTES - clientVotes);
    
    console.log(`User ${clientId} has ${clientVotes} votes used, ${remainingVotes} remaining out of ${MAX_ANONYMOUS_VOTES}`);
    
    return createSuccessResponse({
      remainingVotes,
      maxVotes: MAX_ANONYMOUS_VOTES,
      votesUsed: clientVotes,
    });
  } catch (error) {
    console.error("Error checking remaining votes:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to check remaining votes",
      500
    );
  }
}

// Helper function to check if a client has remaining votes
export async function hasRemainingVotes(clientId: string): Promise<boolean> {
  try {
    if (!clientId) {
      console.error("Cannot check remaining votes: Client ID is required");
      return false;
    }
    
    const state = await getVoteState();
    
    // Count active votes for this client
    const clientVotes = Object.keys(state.votes)
      .filter(key => key.startsWith(clientId + ':'))
      .length;
    
    const hasRemaining = clientVotes < MAX_ANONYMOUS_VOTES;
    console.log(`Client ${clientId} has ${clientVotes} votes, has remaining: ${hasRemaining}`);
    
    return hasRemaining;
  } catch (error) {
    console.error("Error in hasRemainingVotes:", error);
    return false; // Fail safely by assuming no remaining votes
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';
import { saveActivity } from '../activities/route';
import { v4 as uuidv4 } from 'uuid';
import { updateVote, getUserVote, getProductVoteCounts } from '../../lib/vote-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface VoteCounts {
  upvotes: number;
  downvotes: number;
}

export interface VoteState {
  votes: Record<string, number>;
  voteCounts: Record<string, VoteCounts>;
  lastUpdated: string;
}

// Use absolute paths
const DATA_DIR = path.join(process.cwd(), 'data');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');

// Ensure the data directory and file exist
try {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  }
  
  if (!existsSync(VOTES_FILE)) {
    writeFileSync(VOTES_FILE, JSON.stringify({
      votes: {},
      voteCounts: {},
      lastUpdated: new Date().toISOString()
    }, null, 2), 'utf8');
    console.log('Created votes file:', VOTES_FILE);
  }
} catch (error) {
  console.error('Error setting up data storage:', error);
}

// Initialize or load vote state with retries
async function getVoteState(): Promise<VoteState> {
  let lastError;
  
  for (let i = 0; i < 3; i++) {
    try {
      if (!existsSync(VOTES_FILE)) {
        const initialState = {
          votes: {},
          voteCounts: {},
          lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(VOTES_FILE, JSON.stringify(initialState, null, 2), 'utf8');
        return initialState;
      }

      const data = await fs.readFile(VOTES_FILE, 'utf8');
      const state = JSON.parse(data);
      
      // Validate state structure
      if (!state.votes || !state.voteCounts) {
        throw new Error('Invalid vote state structure');
      }
      
      return {
        votes: state.votes,
        voteCounts: state.voteCounts,
        lastUpdated: state.lastUpdated || new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error reading vote state (attempt ${i + 1}):`, error);
      lastError = error;
      
      if (i < 2) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
  
  // If all retries failed, try to recover by creating a new state
  console.error('All attempts to read vote state failed, creating new state');
  const recoveryState = {
    votes: {},
    voteCounts: {},
    lastUpdated: new Date().toISOString()
  };
  
  try {
    await fs.writeFile(VOTES_FILE, JSON.stringify(recoveryState, null, 2), 'utf8');
    return recoveryState;
  } catch (error) {
    console.error('Failed to create recovery state:', error);
    throw lastError || error;
  }
}

// Save vote state with retries and atomic write
async function saveVoteState(state: VoteState, retries = 3): Promise<void> {
  const tempFile = `${VOTES_FILE}.tmp`;
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      // Update timestamp
      state.lastUpdated = new Date().toISOString();
      
      // Write to temporary file first
      await fs.writeFile(tempFile, JSON.stringify(state, null, 2), 'utf8');
      
      // Rename temp file to actual file (atomic operation)
      await fs.rename(tempFile, VOTES_FILE);
      
      console.log('Successfully saved vote state');
      return;
    } catch (error) {
      console.error(`Error saving vote state (attempt ${i + 1}):`, error);
      lastError = error;
      
      // Clean up temp file if it exists
      try {
        if (existsSync(tempFile)) {
          await fs.unlink(tempFile);
        }
      } catch (cleanupError) {
        console.error('Error cleaning up temp file:', cleanupError);
      }
      
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i))); // Exponential backoff
      }
    }
  }
  
  throw lastError || new Error('Failed to save vote state');
}

// Initialize some default vote counts if they don't exist
export async function ensureProductVoteCounts(productId: string): Promise<VoteCounts> {
  const state = await getVoteState();
  if (!state.voteCounts[productId]) {
    state.voteCounts[productId] = { upvotes: 0, downvotes: 0 };
    await saveVoteState(state);
  }
  return state.voteCounts[productId];
}

// Schema for vote request
const voteSchema = z.object({
  productId: z.string(),
  voteType: z.number().int().min(-1).max(1),
  clientId: z.string(),
  productName: z.string()
});

export async function POST(request: NextRequest) {
  try {
    console.log('Vote API: Received POST request');
    const body = await request.json();
    console.log('Vote API: Request body:', JSON.stringify(body, null, 2));

    // Validate request body
    const validatedData = voteSchema.parse(body);
    console.log('Vote API: Validated data:', validatedData);

    // Update vote
    const result = await updateVote(
      validatedData.productId,
      validatedData.clientId,
      validatedData.voteType
    );
    console.log('Vote API: Update result:', result);

    // Calculate score
    const score = result.voteCounts.upvotes - result.voteCounts.downvotes;

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        score
      }
    });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process vote' },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('Vote API: Received GET request');
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const clientId = searchParams.get('clientId') || 'anonymous';

    console.log('Vote API: Params:', { productId, clientId });

    if (!productId) {
      throw new Error('Product ID is required');
    }

    // Get vote counts and user's vote
    const [voteCounts, userVote] = await Promise.all([
      getProductVoteCounts(productId),
      getUserVote(productId, clientId)
    ]);

    console.log('Vote API: Results:', { voteCounts, userVote });

    // Calculate score
    const score = voteCounts.upvotes - voteCounts.downvotes;

    return NextResponse.json({
      success: true,
      result: {
        voteCounts,
        userVote,
        score
      }
    });
  } catch (error) {
    console.error('Vote API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get vote status' },
      { status: 400 }
    );
  }
}
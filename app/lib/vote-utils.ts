import { promises as fs } from 'fs';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';

export interface VoteCounts {
  upvotes: number;
  downvotes: number;
}

export interface VoteState {
  votes: Record<string, number>;
  voteCounts: Record<string, VoteCounts>;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');

// Initialize the votes file and directory
export async function initializeVoteState() {
  try {
    // Create data directory if it doesn't exist
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
      console.log('Created data directory:', DATA_DIR);
    }

    // Create votes file if it doesn't exist
    if (!existsSync(VOTES_FILE)) {
      const initialState: VoteState = {
        votes: {},
        voteCounts: {},
        lastUpdated: new Date().toISOString()
      };
      writeFileSync(VOTES_FILE, JSON.stringify(initialState, null, 2), 'utf8');
      console.log('Created votes file:', VOTES_FILE);
    }
  } catch (error) {
    console.error('Error initializing vote state:', error);
    throw error;
  }
}

// Get the current vote state
export async function getVoteState(): Promise<VoteState> {
  try {
    await initializeVoteState();
    console.log('Reading vote state from:', VOTES_FILE);
    const data = await fs.readFile(VOTES_FILE, 'utf-8');
    const state = JSON.parse(data);
    
    // Validate state structure
    if (!state.votes || !state.voteCounts) {
      console.error('Invalid vote state structure:', state);
      throw new Error('Invalid vote state structure');
    }
    
    // Initialize vote counts for all products if they don't exist
    const productIds = [
      'j1k2l3m4-n5o6-p7q8-r9s0-t1u2v3w4x5y6', // ASUS monitor
      'c8d9e0f1-2a3b-4c5d-6e7f-8g9h0i1j2k3l', // Razer mouse
      '9dd2bfe2-6eef-40de-ae12-c35ff1975914',  // Logitech mouse
      'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6', // Logitech G Pro X
      'q1w2e3r4-t5y6-u7i8-o9p0-a1s2d3f4g5h6', // SteelSeries Apex Pro
      'z1x2c3v4-b5n6-m7k8-j9h0-g1f2d3s4a5', // Ducky One 3
      'p9o8i7u6-y5t4-r3e2-w1q0-z9x8c7v6b5', // Samsung Odyssey G7
      'n4m3b2v1-c8x7z6-p5o4i3-u2y1t0-r9e8w7q6', // HyperX Cloud Alpha
      'l5k4j3h2-g1f0d9-s8a7p6-o5i4u3-y2t1r0e9', // SteelSeries Arctis Pro
      'w9q8e7r6-t5y4u3-i2o1p0-a9s8d7-f6g5h4j3' // Logitech G915
    ];
    
    let stateUpdated = false;
    for (const productId of productIds) {
      if (!state.voteCounts[productId]) {
        state.voteCounts[productId] = { upvotes: 0, downvotes: 0 };
        stateUpdated = true;
      }
    }
    
    // Save state if any products were initialized
    if (stateUpdated) {
      await saveVoteState(state);
    }
    
    console.log('Successfully read vote state:', state);
    return state;
  } catch (error) {
    console.error('Error reading vote state:', error);
    // Return a fresh state if there's an error
    return {
      votes: {},
      voteCounts: {},
      lastUpdated: new Date().toISOString()
    };
  }
}

// Save the vote state
export async function saveVoteState(state: VoteState): Promise<void> {
  const tempFile = `${VOTES_FILE}.tmp`;
  try {
    await initializeVoteState();
    console.log('Saving vote state:', JSON.stringify(state, null, 2));
    
    // Validate state structure before saving
    if (!state.votes || !state.voteCounts || typeof state.lastUpdated !== 'string') {
      throw new Error('Invalid vote state structure');
    }
    
    // Update lastUpdated timestamp
    state.lastUpdated = new Date().toISOString();
    
    // Write to temporary file first
    await fs.writeFile(tempFile, JSON.stringify(state, null, 2), 'utf8');
    console.log('Written to temp file:', tempFile);
    
    // Ensure the write was successful by reading back the file
    const tempData = await fs.readFile(tempFile, 'utf8');
    const parsedData = JSON.parse(tempData);
    if (!parsedData.votes || !parsedData.voteCounts) {
      throw new Error('Validation failed after writing temp file');
    }
    
    // Rename temp file to actual file (atomic operation)
    await fs.rename(tempFile, VOTES_FILE);
    console.log('Successfully saved vote state to:', VOTES_FILE);
    
    // Verify the final file
    const finalData = await fs.readFile(VOTES_FILE, 'utf8');
    console.log('Verified saved data:', finalData);
  } catch (error) {
    console.error('Error saving vote state:', error);
    // Clean up temp file if it exists
    try {
      if (existsSync(tempFile)) {
        await fs.unlink(tempFile);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up temp file:', cleanupError);
    }
    throw error;
  }
}

// Get vote counts for a product
export async function getProductVoteCounts(productId: string): Promise<VoteCounts> {
  const state = await getVoteState();
  console.log('Getting vote counts for product:', productId, state.voteCounts[productId]);
  return state.voteCounts[productId] || { upvotes: 0, downvotes: 0 };
}

// Get user's vote for a product
export async function getUserVote(productId: string, clientId: string): Promise<number | null> {
  const state = await getVoteState();
  const voteKey = `${productId}:${clientId}`;
  console.log('Getting user vote:', { productId, clientId, vote: state.votes[voteKey] });
  return state.votes[voteKey] || null;
}

// Update vote for a product
export async function updateVote(
  productId: string,
  clientId: string,
  voteType: number | null
): Promise<{ voteCounts: VoteCounts; userVote: number | null }> {
  console.log('Updating vote:', { productId, clientId, voteType });
  const state = await getVoteState();
  const voteKey = `${productId}:${clientId}`;
  const currentVote = state.votes[voteKey];
  
  console.log('Current vote state:', {
    voteKey,
    currentVote,
    currentCounts: state.voteCounts[productId]
  });
  
  // Initialize vote counts if they don't exist
  if (!state.voteCounts[productId]) {
    state.voteCounts[productId] = { upvotes: 0, downvotes: 0 };
  }
  
  // If voting the same way as current vote, remove the vote
  if (currentVote === voteType) {
    if (currentVote === 1) {
      state.voteCounts[productId].upvotes = Math.max(0, state.voteCounts[productId].upvotes - 1);
    } else if (currentVote === -1) {
      state.voteCounts[productId].downvotes = Math.max(0, state.voteCounts[productId].downvotes - 1);
    }
    delete state.votes[voteKey];
    console.log('Removed vote - same type as current');
  } else {
    // Remove old vote if it exists
    if (currentVote) {
      if (currentVote === 1) {
        state.voteCounts[productId].upvotes = Math.max(0, state.voteCounts[productId].upvotes - 1);
      } else if (currentVote === -1) {
        state.voteCounts[productId].downvotes = Math.max(0, state.voteCounts[productId].downvotes - 1);
      }
      delete state.votes[voteKey];
      console.log('Removed old vote');
    }
    
    // Add new vote
    if (voteType) {
      state.votes[voteKey] = voteType;
      if (voteType === 1) {
        state.voteCounts[productId].upvotes++;
      } else if (voteType === -1) {
        state.voteCounts[productId].downvotes++;
      }
      console.log('Added new vote');
    }
  }
  
  console.log('New vote state:', {
    votes: state.votes,
    voteCounts: state.voteCounts[productId]
  });
  
  // Save the updated state
  await saveVoteState(state);
  
  return {
    voteCounts: state.voteCounts[productId],
    userVote: state.votes[voteKey] || null
  };
} 
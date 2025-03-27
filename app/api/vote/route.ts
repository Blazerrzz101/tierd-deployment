import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

// Ensure Vote API is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_REQUESTS_PER_WINDOW = 5; // 5 votes per 10 seconds
const RATE_LIMIT_STORE: Record<string, number[]> = {};

// Clean up old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  Object.keys(RATE_LIMIT_STORE).forEach(key => {
    RATE_LIMIT_STORE[key] = RATE_LIMIT_STORE[key].filter(
      timestamp => now - timestamp < RATE_LIMIT_WINDOW
    );
    
    // Remove empty entries
    if (RATE_LIMIT_STORE[key].length === 0) {
      delete RATE_LIMIT_STORE[key];
    }
  });
}, 3600000); // Clean up every hour

// Check if request should be rate limited
function isRateLimited(identifier: string): boolean {
  const now = Date.now();
  
  // Initialize store if not exists
  if (!RATE_LIMIT_STORE[identifier]) {
    RATE_LIMIT_STORE[identifier] = [];
  }
  
  // Clean up old timestamps outside the window
  RATE_LIMIT_STORE[identifier] = RATE_LIMIT_STORE[identifier].filter(
    timestamp => now - timestamp < RATE_LIMIT_WINDOW
  );
  
  // Check if too many requests
  if (RATE_LIMIT_STORE[identifier].length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  // Record this request
  RATE_LIMIT_STORE[identifier].push(now);
  return false;
}

// Path to local votes store (fallback when database has issues)
const VOTES_FILE_PATH = path.join(process.cwd(), 'data', 'votes.json');

// Function to read votes from local file
const readVotesFile = () => {
  try {
    if (!fs.existsSync(VOTES_FILE_PATH)) {
      // Create the directory if it doesn't exist
      if (!fs.existsSync(path.dirname(VOTES_FILE_PATH))) {
        fs.mkdirSync(path.dirname(VOTES_FILE_PATH), { recursive: true });
      }
      
      // Initialize with empty data
      const initialData = {
        votes: {},
        voteCounts: {},
        lastUpdated: new Date().toISOString(),
        userVotes: []
      };
      
      fs.writeFileSync(VOTES_FILE_PATH, JSON.stringify(initialData, null, 2));
      return initialData;
    }
    
    const data = fs.readFileSync(VOTES_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading votes file:', error);
    return {
      votes: {},
      voteCounts: {},
      lastUpdated: new Date().toISOString(),
      userVotes: []
    };
  }
};

// Function to write votes to local file
const writeVotesFile = (data: any) => {
  try {
    // Create the directory if it doesn't exist
    if (!fs.existsSync(path.dirname(VOTES_FILE_PATH))) {
      fs.mkdirSync(path.dirname(VOTES_FILE_PATH), { recursive: true });
    }
    
    fs.writeFileSync(VOTES_FILE_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing votes file:', error);
    return false;
  }
};

// Helper functions for votes
const getVoteKey = (productId: string, clientId: string) => `${clientId}:${productId}`;
const getVoteKeyReversed = (productId: string, clientId: string) => `${productId}:${clientId}`;

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

// Get vote status for a product
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    // Try to get client ID from multiple places
    let clientId = searchParams.get('clientId');
    
    // If not in query params, check headers
    if (!clientId || clientId === 'undefined' || clientId === 'null' || clientId === 'server-side') {
      const headerClientId = request.headers.get('X-Client-ID');
      if (headerClientId) {
        console.log('Using client ID from X-Client-ID header');
        clientId = headerClientId;
      }
    }
    
    // Validate parameters
    if (!productId) {
      return createErrorResponse('Product ID is required');
    }

    // Generate a fallback client ID if none provided
    if (!clientId || clientId === 'undefined' || clientId === 'null' || clientId === 'server-side') {
      console.warn('Client ID missing or invalid in GET request - generating fallback ID');
      clientId = `fallback-${Math.random().toString(36).substring(2, 10)}`;
    }

    console.log(`[GET] Checking vote status: product=${productId}, client=${clientId}`);

    // Try the Supabase RPC first
    try {
      console.log('Using two-parameter version of has_user_voted');
      const { data, error } = await supabaseServer.rpc('has_user_voted', {
        p_product_id: productId,
        p_client_id: clientId
      });

      if (!error) {
        console.log('Vote status check successful:', data);
        return createSuccessResponse({
          productId,
          hasVoted: data?.has_voted || false,
          voteType: data?.vote_type || null,
          ...data
        });
      }
      
      console.error('Error with Supabase RPC:', error);
      
      // Fall back to local file system
      console.log('Falling back to local file system...');
      const voteStore = readVotesFile();
      
      // Check if this client has voted for this product
      const voteKey = getVoteKey(productId, clientId);
      const voteKeyAlt = getVoteKeyReversed(productId, clientId);
      
      const voteType = voteStore.votes[voteKey] || voteStore.votes[voteKeyAlt] || null;
      const productCounts = voteStore.voteCounts[productId] || { upvotes: 0, downvotes: 0 };
      
      console.log('Local vote check result:', { voteType, productCounts });
      
      return createSuccessResponse({
        productId,
        hasVoted: voteType !== null,
        voteType: voteType,
        upvotes: productCounts.upvotes,
        downvotes: productCounts.downvotes,
        score: (productCounts.upvotes || 0) - (productCounts.downvotes || 0)
      });
    } catch (queryError) {
      console.error('Error checking vote status:', queryError);
      
      // Fall back to local file system on any error
      try {
        const voteStore = readVotesFile();
        const voteKey = getVoteKey(productId, clientId);
        const voteKeyAlt = getVoteKeyReversed(productId, clientId);
        
        const voteType = voteStore.votes[voteKey] || voteStore.votes[voteKeyAlt] || null;
        const productCounts = voteStore.voteCounts[productId] || { upvotes: 0, downvotes: 0 };
        
        return createSuccessResponse({
          productId,
          hasVoted: voteType !== null,
          voteType: voteType,
          upvotes: productCounts.upvotes,
          downvotes: productCounts.downvotes,
          score: (productCounts.upvotes || 0) - (productCounts.downvotes || 0)
        });
      } catch (fileError) {
        // Return a default response if all methods fail
        return createSuccessResponse({
          productId,
          hasVoted: false,
          voteType: null,
          error: 'Failed to check vote status'
        });
      }
    }
  } catch (error) {
    console.error('Error processing vote GET request:', error);
    return createErrorResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

// Handle voting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, voteType } = body;
    
    // Try to get client ID from multiple places
    let clientId = body.clientId;
    
    // If not in body, check headers
    if (!clientId || clientId === 'undefined' || clientId === 'null' || clientId === 'server-side') {
      const headerClientId = request.headers.get('X-Client-ID');
      if (headerClientId) {
        console.log('Using client ID from X-Client-ID header');
        clientId = headerClientId;
      }
    }
    
    const userId = body.userId || null; // Get userId if provided

    // Validate input parameters
    if (!productId) {
      return createErrorResponse('Product ID is required');
    }
    
    // Generate a fallback client ID if none provided
    if (!clientId || clientId === 'undefined' || clientId === 'null' || clientId === 'server-side') {
      console.warn('Client ID missing or invalid in POST request - generating fallback ID');
      clientId = `fallback-${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // Allow voteType to be 1, -1, or null
    if (voteType !== 1 && voteType !== -1 && voteType !== null) {
      return createErrorResponse('Invalid vote type (must be 1, -1, or null to remove a vote)');
    }

    console.log(`Processing vote: product=${productId}, client=${clientId}, voteType=${voteType}, userId=${userId}`);
    
    // Apply rate limiting
    const identifier = userId || clientId;
    if (isRateLimited(identifier)) {
      console.log(`Rate limit exceeded for ${identifier}`);
      return createErrorResponse('You are voting too quickly. Please slow down.', 429);
    }

    // Try the Supabase RPC first
    try {
      console.log('Trying vote with Supabase RPC...');
      
      // Handle null vote type (remove vote) differently
      if (voteType === null) {
        console.log('Removing vote via Supabase RPC...');
        // Check the current vote first
        const { data: currentVote, error: checkError } = await supabaseServer.rpc('has_user_voted', {
          p_product_id: productId,
          p_client_id: clientId
        });
        
        if (checkError) {
          console.error('Error checking current vote:', checkError);
          throw new Error('Failed to check current vote status');
        }
        
        // If there is a current vote, remove it by toggling it
        if (currentVote?.has_voted && currentVote?.vote_type) {
          console.log(`Removing vote by toggling existing vote of type ${currentVote.vote_type}`);
          const { data, error } = await supabaseServer.rpc('vote_for_product', {
            p_product_id: productId,
            p_vote_type: currentVote.vote_type, // Toggle by voting the same type
            p_client_id: clientId
          });
          
          if (!error) {
            console.log('Vote removed successfully via Supabase:', data);
            // Update local vote store to keep in sync
            updateLocalVotes(productId, clientId, null);
            
            return createSuccessResponse({
              productId,
              voteType: null,
              message: "Vote removed successfully",
              ...data
            });
          } else {
            console.error('Error removing vote with Supabase RPC:', error);
            throw new Error('Failed to remove vote');
          }
        } else {
          // No existing vote to remove
          console.log('No existing vote to remove');
          return createSuccessResponse({
            productId,
            voteType: null,
            message: "No vote to remove",
            upvotes: currentVote?.upvotes || 0,
            downvotes: currentVote?.downvotes || 0,
            score: (currentVote?.upvotes || 0) - (currentVote?.downvotes || 0)
          });
        }
      } else {
        // Handle regular upvote/downvote
        const { data, error } = await supabaseServer.rpc('vote_for_product', {
          p_product_id: productId,
          p_vote_type: voteType,
          p_client_id: clientId
        });
        
        if (!error) {
          console.log('Vote submitted successfully via Supabase:', data);
          // Update local vote store as well to keep in sync
          updateLocalVotes(productId, clientId, voteType);
          
          return createSuccessResponse({
            productId,
            ...data
          });
        }
        
        console.error('Error with Supabase RPC:', error);
        
        // Fall back to local file system voting
        console.log('Falling back to local file system voting...');
        const result = updateLocalVotes(productId, clientId, voteType);
        
        return createSuccessResponse({
          productId,
          ...result
        });
      }
    } catch (votingError) {
      console.error('Error during vote operation:', votingError);
      
      // Fall back to local file system voting
      try {
        console.log('Falling back to local file system voting after error...');
        const result = updateLocalVotes(productId, clientId, voteType);
        
        return createSuccessResponse({
          productId,
          ...result
        });
      } catch (fileError) {
        return createErrorResponse(`Vote operation failed: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`, 500);
      }
    }
  } catch (error) {
    console.error('Error processing vote POST request:', error);
    return createErrorResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

// Function to update local votes
function updateLocalVotes(productId: string, clientId: string, voteType: number | null) {
  // Read current votes
  const voteStore = readVotesFile();
  const voteKey = getVoteKey(productId, clientId);
  const existingVote = voteStore.votes[voteKey];
  
  let result = {
    success: true,
    message: '',
    voteType: null as null | number
  };
  
  // Initialize product vote counts if needed
  if (!voteStore.voteCounts[productId]) {
    voteStore.voteCounts[productId] = { upvotes: 0, downvotes: 0 };
  }
  
  // Handle the vote
  if (voteType === null) {
    // If null vote type, remove the existing vote
    if (existingVote !== undefined) {
      // Update counters based on previous vote
      if (existingVote === 1) {
        voteStore.voteCounts[productId].upvotes = Math.max(0, voteStore.voteCounts[productId].upvotes - 1);
      } else if (existingVote === -1) {
        voteStore.voteCounts[productId].downvotes = Math.max(0, voteStore.voteCounts[productId].downvotes - 1);
      }
      
      // Remove the vote
      delete voteStore.votes[voteKey];
      
      result.message = 'Vote removed';
      result.voteType = null;
      
      // Add to user votes history
      voteStore.userVotes.push({
        productId,
        clientId,
        voteType: 0, // 0 means removing vote
        timestamp: new Date().toISOString()
      });
    } else {
      // No vote to remove
      result.message = 'No vote to remove';
      result.voteType = null;
    }
  } else if (existingVote === undefined) {
    // New vote
    voteStore.votes[voteKey] = voteType;
    
    // Update counters
    if (voteType === 1) {
      voteStore.voteCounts[productId].upvotes++;
    } else if (voteType === -1) {
      voteStore.voteCounts[productId].downvotes++;
    }
    
    result.message = voteType === 1 ? 'Upvoted successfully' : 'Downvoted successfully';
    result.voteType = voteType;
    
    // Add to user votes history
    voteStore.userVotes.push({
      productId,
      clientId,
      voteType,
      timestamp: new Date().toISOString()
    });
  } else if (existingVote === voteType) {
    // Remove vote (toggle)
    voteStore.votes[voteKey] = null;
    delete voteStore.votes[voteKey];
    
    // Update counters
    if (voteType === 1) {
      voteStore.voteCounts[productId].upvotes = Math.max(0, voteStore.voteCounts[productId].upvotes - 1);
    } else if (voteType === -1) {
      voteStore.voteCounts[productId].downvotes = Math.max(0, voteStore.voteCounts[productId].downvotes - 1);
    }
    
    result.message = 'Vote removed';
    result.voteType = null;
    
    // Add to user votes history
    voteStore.userVotes.push({
      productId,
      clientId,
      voteType: 0, // 0 means removing vote
      timestamp: new Date().toISOString()
    });
  } else {
    // Change vote
    voteStore.votes[voteKey] = voteType;
    
    // Update counters
    if (existingVote === 1 && voteType === -1) {
      voteStore.voteCounts[productId].upvotes = Math.max(0, voteStore.voteCounts[productId].upvotes - 1);
      voteStore.voteCounts[productId].downvotes++;
    } else if (existingVote === -1 && voteType === 1) {
      voteStore.voteCounts[productId].downvotes = Math.max(0, voteStore.voteCounts[productId].downvotes - 1);
      voteStore.voteCounts[productId].upvotes++;
    }
    
    result.message = voteType === 1 ? 'Upvoted successfully' : 'Downvoted successfully';
    result.voteType = voteType;
    
    // Add to user votes history
    voteStore.userVotes.push({
      productId,
      clientId,
      voteType,
      timestamp: new Date().toISOString()
    });
  }
  
  // Update last updated timestamp
  voteStore.lastUpdated = new Date().toISOString();
  
  // Save the updated votes
  writeVotesFile(voteStore);
  
  // Return the result with vote counts
  return {
    ...result,
    upvotes: voteStore.voteCounts[productId].upvotes,
    downvotes: voteStore.voteCounts[productId].downvotes,
    score: voteStore.voteCounts[productId].upvotes - voteStore.voteCounts[productId].downvotes
  };
} 
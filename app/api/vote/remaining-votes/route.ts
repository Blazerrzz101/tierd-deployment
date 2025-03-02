import { NextRequest, NextResponse } from "next/server";

// Ensure API is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// In a real application, this would be stored in a database
// For this mock implementation, we'll use an in-memory store
const anonymousVoteCounts: Record<string, number> = {};

// Maximum allowed votes for anonymous users
const MAX_ANONYMOUS_VOTES = 5;

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

    // Get the number of votes used by this client
    const votesUsed = anonymousVoteCounts[clientId] || 0;
    const remainingVotes = Math.max(0, MAX_ANONYMOUS_VOTES - votesUsed);

    return createSuccessResponse({
      remainingVotes,
      maxVotes: MAX_ANONYMOUS_VOTES,
      votesUsed,
    });
  } catch (error) {
    console.error("Error checking remaining votes:", error);
    return createErrorResponse(
      error instanceof Error ? error.message : "Failed to check remaining votes",
      500
    );
  }
}

// Helper function to increment vote count for a client (exposed for other routes to use)
export function incrementVoteCount(clientId: string): number {
  if (!clientId) {
    console.error("Cannot increment vote count: Client ID is required");
    return MAX_ANONYMOUS_VOTES;
  }
  
  if (!anonymousVoteCounts[clientId]) {
    anonymousVoteCounts[clientId] = 0;
  }
  
  anonymousVoteCounts[clientId]++;
  return MAX_ANONYMOUS_VOTES - anonymousVoteCounts[clientId];
}

// Helper function to check if a client has remaining votes
export function hasRemainingVotes(clientId: string): boolean {
  if (!clientId) {
    console.error("Cannot check remaining votes: Client ID is required");
    return false;
  }
  
  const votesUsed = anonymousVoteCounts[clientId] || 0;
  return votesUsed < MAX_ANONYMOUS_VOTES;
} 
import { NextRequest, NextResponse } from "next/server";

interface LinkVotesRequest {
  userId: string;
  clientId: string;
}

// In a real app, this would update a database
// For this mock implementation, we'll just log the linking
export async function POST(request: NextRequest) {
  try {
    const body: LinkVotesRequest = await request.json();
    const { userId, clientId } = body;

    if (!userId || !clientId) {
      return NextResponse.json(
        { success: false, error: "Both userId and clientId are required" },
        { status: 400 }
      );
    }

    console.log(`Linking anonymous votes from clientId: ${clientId} to userId: ${userId}`);
    
    // In a real app, we would:
    // 1. Find all votes made by this clientId
    // 2. Update those votes to be associated with the userId
    // 3. Remove the clientId association
    // 4. Update any vote counts or caches
    
    // For this mock implementation, we'll simulate a delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      message: "Anonymous votes successfully linked to user account",
      linkedVotes: Math.floor(Math.random() * 6), // Mock number of linked votes
    });
  } catch (error) {
    console.error("Error linking anonymous votes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to link anonymous votes" },
      { status: 500 }
    );
  }
} 
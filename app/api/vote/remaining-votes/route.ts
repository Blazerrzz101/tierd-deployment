import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Ensure Vote API is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Constants
const MAX_ANON_VOTES = 5; // Anonymous users are limited to 5 votes
const DEFAULT_REMAINING_VOTES = {
  remainingVotes: MAX_ANON_VOTES,
  totalVotes: 0,
  isAuthenticated: false,
  maxVotes: MAX_ANON_VOTES
};

// Export for use in other routes
export async function hasRemainingVotes(clientId: string, userId: string | null = null): Promise<boolean> {
  try {
    // Authenticated users have unlimited votes
    if (userId) {
      return true;
    }

    // Check remaining votes for anonymous users
    const { data, error } = await supabaseServer.rpc('get_remaining_client_votes', {
      p_client_id: clientId,
      p_max_votes: MAX_ANON_VOTES
    });

    if (error) {
      console.error('Error checking remaining votes:', error);
      return false;
    }

    return data.remaining_votes > 0;
  } catch (error) {
    console.error('Error checking remaining votes:', error);
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');
    const userId = searchParams.get('userId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    // Authenticated users have unlimited votes
    if (userId) {
      return NextResponse.json({
        remainingVotes: Number.MAX_SAFE_INTEGER,
        totalVotes: 0,
        isAuthenticated: true,
        maxVotes: Number.MAX_SAFE_INTEGER
      });
    }

    // For anonymous users, check votes in Supabase
    const { data, error } = await supabaseServer.rpc('get_remaining_client_votes', {
      p_client_id: clientId,
      p_max_votes: MAX_ANON_VOTES
    });

    if (error) {
      console.error('Error getting remaining votes:', error);
      return NextResponse.json(
        { error: `Failed to get remaining votes: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      remainingVotes: data.remaining_votes,
      totalVotes: data.total_votes,
      isAuthenticated: false,
      maxVotes: MAX_ANON_VOTES
    });
  } catch (error) {
    console.error('Error getting remaining votes:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// Ensure Vote API is dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
    const clientId = searchParams.get('clientId');
    
    // Validate parameters
    if (!productId) {
      return createErrorResponse('Product ID is required');
    }

    if (!clientId) {
      return createErrorResponse('Client ID is required');
    }

    // Get the current vote status from Supabase
    const { data, error } = await supabaseServer.rpc('has_user_voted', {
      p_product_id: productId,
      p_client_id: clientId
    });

    if (error) {
      console.error('Error checking vote status:', error);
      return createErrorResponse(`Error checking vote status: ${error.message}`, 500);
    }

    return createSuccessResponse({
      productId,
      ...data
    });
  } catch (error) {
    console.error('Error processing vote GET request:', error);
    return createErrorResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
}

// Handle voting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, clientId, voteType } = body;
    const userId = body.userId || null; // Get userId if provided

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

    console.log(`Processing vote: product=${productId}, client=${clientId}, voteType=${voteType}, userId=${userId}`);

    // Call the Supabase RPC function to handle voting
    const { data, error } = await supabaseServer.rpc('vote_for_product', {
      p_product_id: productId,
      p_vote_type: voteType,
      p_user_id: userId,
      p_client_id: clientId
    });

    if (error) {
      console.error('Error submitting vote:', error);
      return createErrorResponse(`Error submitting vote: ${error.message}`, 500);
    }

    console.log('Vote result:', data);
    
    // Return the response from the RPC function
    return createSuccessResponse({
      productId,
      ...data
    });
  } catch (error) {
    console.error('Error processing vote POST request:', error);
    return createErrorResponse(`Server error: ${error instanceof Error ? error.message : 'Unknown error'}`, 500);
  }
} 
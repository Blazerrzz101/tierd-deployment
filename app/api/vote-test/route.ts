import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const clientId = searchParams.get('clientId') || 'test-client-id';

  if (!productId) {
    return NextResponse.json({ 
      error: 'Missing productId parameter',
      params: Object.fromEntries(searchParams.entries())
    }, { status: 400 });
  }

  try {
    // Get product details
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, upvotes, downvotes')
      .eq('id', productId)
      .single();
    
    if (productError) {
      return NextResponse.json({ 
        error: 'Error fetching product',
        details: productError 
      }, { status: 500 });
    }

    // Get vote state
    const { data: voteData, error: voteError } = await supabase.rpc(
      'has_user_voted',
      { 
        p_product_id: productId,
        p_client_id: clientId
      }
    );
    
    if (voteError) {
      return NextResponse.json({ 
        error: 'Error checking vote',
        details: voteError 
      }, { status: 500 });
    }

    // Return both product and vote state
    return NextResponse.json({
      product: {
        ...product,
        upvotes: Number(product.upvotes) || 0,
        downvotes: Number(product.downvotes) || 0,
        score: (Number(product.upvotes) || 0) - (Number(product.downvotes) || 0)
      },
      vote: voteData,
      debug: {
        productData: {
          raw: product,
          upvotesType: typeof product.upvotes,
          downvotesType: typeof product.downvotes
        },
        voteDataRaw: voteData,
        clientId
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { productId, voteType, clientId = 'test-client-id' } = await request.json();
    
    if (!productId) {
      return NextResponse.json({ 
        error: 'Missing productId parameter' 
      }, { status: 400 });
    }
    
    if (voteType !== 1 && voteType !== -1) {
      return NextResponse.json({ 
        error: 'Invalid voteType, must be 1 or -1' 
      }, { status: 400 });
    }
    
    // Cast vote
    const { data: voteResult, error: voteError } = await supabase.rpc(
      'vote_for_product',
      { 
        p_product_id: productId,
        p_vote_type: voteType,
        p_client_id: clientId
      }
    );
    
    if (voteError) {
      return NextResponse.json({ 
        error: 'Error voting',
        details: voteError 
      }, { status: 500 });
    }
    
    // Get updated product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name, upvotes, downvotes')
      .eq('id', productId)
      .single();
      
    return NextResponse.json({
      success: true,
      voteResult,
      product: {
        ...product,
        upvotes: Number(product?.upvotes) || 0,
        downvotes: Number(product?.downvotes) || 0,
        score: (Number(product?.upvotes) || 0) - (Number(product?.downvotes) || 0)
      },
      debug: {
        productRaw: product,
        voteResultRaw: voteResult
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Convert a value to a safe JSON string
const safeStringify = (value: any) => {
  try {
    return JSON.stringify(
      value,
      (key, value) => {
        if (typeof value === 'bigint') {
          return value.toString();
        }
        return value;
      },
      2
    );
  } catch (e) {
    return `[Error stringifying: ${e}]`;
  }
};

// Debug endpoint to check database structure
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId');
  const mode = searchParams.get('mode') || 'all';
  
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      mode
    };
    
    // Get product schema
    if (['all', 'schema'].includes(mode)) {
      const { data: productColumns, error: schemaError } = await supabaseServer
        .rpc('debug_get_columns', { table_name: 'products' });
        
      results.schema = {
        products: productColumns,
        error: schemaError
      };
      
      const { data: voteColumns, error: voteSchemaError } = await supabaseServer
        .rpc('debug_get_columns', { table_name: 'votes' });
        
      results.schema.votes = voteColumns;
      results.schema.votesError = voteSchemaError;
    }
    
    // Sample data
    if (['all', 'data'].includes(mode)) {
      // Get a sample product
      let productQuery = supabaseServer
        .from('products')
        .select('id, name, upvotes, downvotes, score')
        .limit(1);
        
      if (productId) {
        productQuery = productQuery.eq('id', productId);
      }
      
      const { data: productSample, error: productError } = await productQuery;
      
      results.data = {
        product: productSample?.[0],
        productError
      };
      
      // Get sample votes for this product
      if (productSample?.[0]?.id) {
        const { data: votes, error: votesError } = await supabaseServer
          .from('votes')
          .select('*')
          .eq('product_id', productSample[0].id)
          .limit(5);
          
        results.data.votes = votes;
        results.data.votesError = votesError;
        
        // Compute vote counts manually - safely handle potentially undefined values
        if (votes && votes.length > 0) {
          const upvotes = votes.filter(v => v.vote_type === 1).length;
          const downvotes = votes.filter(v => v.vote_type === -1).length;
          
          results.data.computed = {
            upvotes,
            downvotes,
            score: upvotes - downvotes,
            productValues: {
              upvotes: productSample[0].upvotes,
              downvotes: productSample[0].downvotes,
              score: productSample[0].score
            },
            analysis: {
              upvotesMatch: upvotes === Number(productSample[0].upvotes),
              downvotesMatch: downvotes === Number(productSample[0].downvotes),
              scoreMatch: (upvotes - downvotes) === Number(productSample[0].score)
            }
          };
        }
      }
    }
    
    // Test voting functions directly
    if (['all', 'functions'].includes(mode)) {
      if (!productId) {
        results.functions = {
          error: 'Need productId parameter to test functions'
        };
      } else {
        // Test has_user_voted
        const { data: hasVoted, error: hasVotedError } = await supabaseServer.rpc(
          'has_user_voted',
          { 
            p_product_id: productId,
            p_client_id: 'test-debug-client'
          }
        );
        
        // For testing, let's try both upvote and check
        const { data: voteResult, error: voteError } = await supabaseServer.rpc(
          'vote_for_product',
          { 
            p_product_id: productId,
            p_vote_type: 1,
            p_client_id: 'test-debug-client'
          }
        );
        
        // Check vote again
        const { data: hasVotedAfter, error: hasVotedAfterError } = await supabaseServer.rpc(
          'has_user_voted',
          { 
            p_product_id: productId,
            p_client_id: 'test-debug-client'
          }
        );
        
        results.functions = {
          hasVoted,
          hasVotedError,
          voteResult,
          voteError,
          hasVotedAfter,
          hasVotedAfterError
        };
      }
    }
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error),
      stringified: safeStringify(error)
    }, { status: 500 });
  }
} 
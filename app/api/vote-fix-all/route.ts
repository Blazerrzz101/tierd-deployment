import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * API endpoint to fix all product vote counts in a single operation
 * GET - Returns status of all products and their vote counts
 * POST - Fix all product vote counts
 */
export async function GET(request: NextRequest) {
  try {
    // Get all products (limit can be adjusted)
    const { data: products, error: productsError } = await supabaseServer
      .from('products')
      .select('id, name, upvotes, downvotes, score')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (productsError) {
      return NextResponse.json({ 
        error: 'Error fetching products',
        details: productsError 
      }, { status: 500 });
    }
    
    const results = await Promise.all(products.map(async (product) => {
      try {
        // Count votes directly
        const { data: votes, error: votesError } = await supabaseServer
          .from('votes')
          .select('vote_type')
          .eq('product_id', product.id);
        
        if (votesError) throw votesError;
        
        const directUpvotes = votes?.filter(v => v.vote_type === 1).length || 0;
        const directDownvotes = votes?.filter(v => v.vote_type === -1).length || 0;
        const directScore = directUpvotes - directDownvotes;
        
        // Convert stored values to numbers
        const storedUpvotes = Number(product.upvotes) || 0;
        const storedDownvotes = Number(product.downvotes) || 0;
        const storedScore = Number(product.score) || 0;
        
        return {
          id: product.id,
          name: product.name,
          stored: {
            upvotes: storedUpvotes,
            downvotes: storedDownvotes,
            score: storedScore
          },
          actual: {
            upvotes: directUpvotes,
            downvotes: directDownvotes,
            score: directScore
          },
          needsFixing: directUpvotes !== storedUpvotes || 
                       directDownvotes !== storedDownvotes ||
                       directScore !== storedScore
        };
      } catch (error) {
        return {
          id: product.id,
          name: product.name,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }));
    
    // Summary statistics
    const needFixes = results.filter(r => r.needsFixing).length;
    const errors = results.filter(r => 'error' in r).length;
    
    return NextResponse.json({
      totalProducts: results.length,
      needFixing: needFixes,
      errors: errors,
      products: results
    });
  } catch (error) {
    console.error('Vote fix all status API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication header (optional, could require a specific token)
    const authHeader = request.headers.get('authorization');
    
    // Check for auth in production
    // In this example, we're allowing open access for testing
    
    // Get all products
    const { data: products, error: productsError } = await supabaseServer
      .from('products')
      .select('id');
    
    if (productsError) {
      return NextResponse.json({ 
        error: 'Error fetching products',
        details: productsError 
      }, { status: 500 });
    }
    
    const results: any[] = [];
    let fixedCount = 0;
    
    // Process each product
    for (const product of products || []) {
      try {
        // Get votes for this product
        const { data: votes, error: votesError } = await supabaseServer
          .from('votes')
          .select('vote_type')
          .eq('product_id', product.id);
        
        if (votesError) {
          results.push({
            id: product.id,
            error: votesError
          });
          continue;
        }
        
        // Count the votes
        const upvotes = votes?.filter(v => v.vote_type === 1).length || 0;
        const downvotes = votes?.filter(v => v.vote_type === -1).length || 0;
        const score = upvotes - downvotes;
        
        // Get current product values
        const { data: currentProduct, error: currentError } = await supabaseServer
          .from('products')
          .select('name, upvotes, downvotes, score')
          .eq('id', product.id)
          .single();
        
        if (currentError) {
          results.push({
            id: product.id,
            error: currentError
          });
          continue;
        }
        
        // Check if update is needed
        const storedUpvotes = Number(currentProduct?.upvotes) || 0;
        const storedDownvotes = Number(currentProduct?.downvotes) || 0;
        const storedScore = Number(currentProduct?.score) || 0;
        
        const needsUpdate = 
          upvotes !== storedUpvotes || 
          downvotes !== storedDownvotes || 
          score !== storedScore;
        
        if (needsUpdate) {
          // Update the product
          const { error: updateError } = await supabaseServer
            .from('products')
            .update({
              upvotes: upvotes,
              downvotes: downvotes,
              score: score,
              updated_at: new Date().toISOString()
            })
            .eq('id', product.id);
          
          if (updateError) {
            results.push({
              id: product.id,
              error: updateError
            });
            continue;
          }
          
          fixedCount++;
          
          results.push({
            id: product.id,
            name: currentProduct.name,
            success: true,
            before: {
              upvotes: storedUpvotes,
              downvotes: storedDownvotes,
              score: storedScore
            },
            after: {
              upvotes,
              downvotes,
              score
            }
          });
        } else {
          // No update needed
          results.push({
            id: product.id,
            name: currentProduct.name,
            noChangeNeeded: true
          });
        }
      } catch (error) {
        results.push({
          id: product.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Processed ${results.length} products`,
      fixedCount,
      noChangeCount: results.filter(r => r.noChangeNeeded).length,
      errorCount: results.filter(r => r.error).length,
      results
    });
  } catch (error) {
    console.error('Fix all votes API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// API endpoint to fix vote counts in the database
export async function POST(request: NextRequest) {
  try {
    // Get authentication header (optional, could require a specific token)
    const authHeader = request.headers.get('authorization');
    
    // In production, you'd want to check for a valid token
    // This is a simplified example that could be enhanced with proper auth
    
    const { productId } = await request.json();
    
    // If a specific product ID is provided, only fix that one
    if (productId) {
      // First, get the current vote counts directly from the votes table
      const { data: votes, error: votesError } = await supabaseServer
        .from('votes')
        .select('vote_type')
        .eq('product_id', productId);
      
      if (votesError) {
        return NextResponse.json({ 
          error: 'Error fetching votes',
          details: votesError 
        }, { status: 500 });
      }
      
      // Count the votes manually
      const upvotes = votes?.filter(v => v.vote_type === 1).length || 0;
      const downvotes = votes?.filter(v => v.vote_type === -1).length || 0;
      const score = upvotes - downvotes;
      
      // Update the product with the correct counts
      const { data: updateResult, error: updateError } = await supabaseServer
        .from('products')
        .update({
          upvotes: upvotes,
          downvotes: downvotes,
          score: score,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)
        .select();
      
      if (updateError) {
        return NextResponse.json({ 
          error: 'Error updating product',
          details: updateError 
        }, { status: 500 });
      }
      
      return NextResponse.json({
        success: true,
        message: `Fixed vote counts for product ${productId}`,
        before: {
          upvotes: updateResult?.[0]?.upvotes || 0,
          downvotes: updateResult?.[0]?.downvotes || 0,
          score: updateResult?.[0]?.score || 0
        },
        after: {
          upvotes,
          downvotes,
          score
        }
      });
    } 
    
    // If no product ID is provided, fix all products
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
          .select('upvotes, downvotes, score')
          .eq('id', product.id)
          .single();
        
        if (currentError) {
          results.push({
            id: product.id,
            error: currentError
          });
          continue;
        }
        
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
        
        results.push({
          id: product.id,
          success: true,
          before: {
            upvotes: Number(currentProduct?.upvotes) || 0,
            downvotes: Number(currentProduct?.downvotes) || 0,
            score: Number(currentProduct?.score) || 0
          },
          after: {
            upvotes,
            downvotes,
            score
          },
          changed: upvotes !== Number(currentProduct?.upvotes) || 
                   downvotes !== Number(currentProduct?.downvotes) ||
                   score !== Number(currentProduct?.score)
        });
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
      successCount: results.filter(r => r.success).length,
      changedCount: results.filter(r => r.changed).length,
      errorCount: results.filter(r => r.error).length,
      results
    });
  } catch (error) {
    console.error('Fix votes API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// GET endpoint to get vote fixing status (to avoid multiple POSTs)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (productId) {
      // Get a specific product's vote counts
      const { data: product, error: productError } = await supabaseServer
        .from('products')
        .select('id, name, upvotes, downvotes, score')
        .eq('id', productId)
        .single();
      
      if (productError) {
        return NextResponse.json({ 
          error: 'Error fetching product',
          details: productError 
        }, { status: 500 });
      }
      
      // Count votes directly
      const { data: votes, error: votesError } = await supabaseServer
        .from('votes')
        .select('vote_type')
        .eq('product_id', productId);
      
      if (votesError) {
        return NextResponse.json({ 
          error: 'Error fetching votes',
          details: votesError 
        }, { status: 500 });
      }
      
      const directUpvotes = votes?.filter(v => v.vote_type === 1).length || 0;
      const directDownvotes = votes?.filter(v => v.vote_type === -1).length || 0;
      const directScore = directUpvotes - directDownvotes;
      
      return NextResponse.json({
        product: {
          ...product,
          upvotes: Number(product?.upvotes) || 0,
          downvotes: Number(product?.downvotes) || 0,
          score: Number(product?.score) || 0
        },
        directCounts: {
          upvotes: directUpvotes,
          downvotes: directDownvotes,
          score: directScore
        },
        analysis: {
          upvotesMatch: directUpvotes === Number(product?.upvotes),
          downvotesMatch: directDownvotes === Number(product?.downvotes),
          scoreMatch: directScore === Number(product?.score),
          needsFixing: directUpvotes !== Number(product?.upvotes) || 
                       directDownvotes !== Number(product?.downvotes) ||
                       directScore !== Number(product?.score)
        }
      });
    }
    
    // Summary of all products (limit to 10 for performance)
    const { data: products, error: productsError } = await supabaseServer
      .from('products')
      .select('id, name, upvotes, downvotes, score')
      .limit(10);
    
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
        
        return {
          id: product.id,
          name: product.name,
          stored: {
            upvotes: Number(product.upvotes) || 0,
            downvotes: Number(product.downvotes) || 0,
            score: Number(product.score) || 0
          },
          direct: {
            upvotes: directUpvotes,
            downvotes: directDownvotes,
            score: directScore
          },
          needsFixing: directUpvotes !== Number(product.upvotes) || 
                     directDownvotes !== Number(product.downvotes) ||
                     directScore !== Number(product.score)
        };
      } catch (error) {
        return {
          id: product.id,
          name: product.name,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }));
    
    return NextResponse.json({
      products: results,
      summary: {
        totalChecked: results.length,
        needFixing: results.filter(r => r.needsFixing).length,
        errors: results.filter(r => r.error).length
      }
    });
  } catch (error) {
    console.error('Vote fix status API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 
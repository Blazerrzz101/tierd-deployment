import { NextRequest, NextResponse } from 'next/server';
import { getProductVoteCounts, getUserVote, updateVote } from '../../../lib/vote-utils';
import { mockProducts, findProductBySlug, getValidProductSlug, slugifyString } from '@/utils/product-utils'; // Add additional imports

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Vote validation schema
type VoteRequest = {
  productId: string;
  voteType: number; // 1 for upvote, -1 for downvote
  clientId: string;
};

export async function GET(request: NextRequest) {
  try {
    console.log("GET /api/products/product");
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const clientId = searchParams.get("clientId") || 'anonymous';

    if (!id && !slug) {
      console.log("Either product ID or slug is required");
      return NextResponse.json({ success: false, error: "Either product ID or slug is required" }, { status: 400 });
    }

    // Find the product by ID or slug
    let product;
    if (id) {
      product = mockProducts.find(p => p.id === id);
    } else if (slug) {
      // Use the findProductBySlug function for more robust slug matching
      product = findProductBySlug(slug);
      
      // If still not found, try normalizing the slug
      if (!product) {
        const normalizedSlug = slugifyString(slug);
        product = mockProducts.find(p => 
          slugifyString(p.name) === normalizedSlug || 
          getValidProductSlug(p) === normalizedSlug
        );
      }
      
      // Last attempt: try partial match
      if (!product) {
        product = mockProducts.find(p => 
          p.name.toLowerCase().includes(slug.toLowerCase()) ||
          (p.url_slug && p.url_slug.toLowerCase().includes(slug.toLowerCase()))
        );
      }
    }

    if (!product) {
      console.log(`Product not found: ${id || slug}`);
      
      // Find similar products as suggestions
      const similarProducts = mockProducts
        .filter(p => 
          p.name.toLowerCase().includes((slug || id || '').toLowerCase()) ||
          (p.url_slug && p.url_slug.toLowerCase().includes((slug || id || '').toLowerCase()))
        )
        .slice(0, 3)
        .map(p => ({ id: p.id, name: p.name, url_slug: getValidProductSlug(p) }));
      
      return NextResponse.json({ 
        success: false, 
        error: "Product not found",
        suggestedProducts: similarProducts.length > 0 ? similarProducts : undefined
      }, { status: 404 });
    }

    // Ensure the product has a valid slug
    if (!product.url_slug || product.url_slug === 'undefined') {
      product.url_slug = getValidProductSlug(product);
    }

    // Get vote data from the vote utils
    const voteCounts = await getProductVoteCounts(product.id);
    const userVote = await getUserVote(product.id, clientId);
    const score = voteCounts.upvotes - voteCounts.downvotes;

    // Create a new product object with the vote data
    const productWithVotes = {
      ...product,
      upvotes: voteCounts.upvotes,
      downvotes: voteCounts.downvotes,
      userVote,
      score
    };

    console.log(`Returning product details for: ${id || slug}, client: ${clientId}`);
    return NextResponse.json({ success: true, product: productWithVotes });
  } catch (error) {
    console.error("Error in GET /api/products/product:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/products/product called');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Validate request body
    const { productId, voteType, clientId = 'anonymous' } = body as VoteRequest;
    
    if (!productId) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }
    
    if (voteType !== 1 && voteType !== -1 && voteType !== 0) {
      return NextResponse.json(
        { success: false, error: "Vote type must be 1 (upvote), -1 (downvote), or 0 (remove vote)" },
        { status: 400 }
      );
    }
    
    // Find the product with the matching ID
    const product = mockProducts.find((p: any) => p.id === productId);
    
    if (!product) {
      console.log(`Product not found: ${productId}`);
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Update the vote using vote-utils
    const voteResult = await updateVote(
      productId, 
      clientId,
      voteType === 0 ? null : voteType
    );
    
    // Calculate the score
    const score = voteResult.voteCounts.upvotes - voteResult.voteCounts.downvotes;
    
    console.log(`Vote counts for ${productId}:`, {
      upvotes: voteResult.voteCounts.upvotes,
      downvotes: voteResult.voteCounts.downvotes,
      score
    });
    
    return NextResponse.json({
      success: true,
      productId,
      upvotes: voteResult.voteCounts.upvotes,
      downvotes: voteResult.voteCounts.downvotes,
      voteType: voteResult.userVote,
      score
    });
  } catch (error) {
    console.error(`Error in POST /api/products/product:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to update vote", message: String(error) },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from "next/server";
import { createProductUrl, getValidProductSlug, Product, mockProducts } from "@/utils/product-utils";
import { getClientId } from "@/utils/client-id";
import { getVoteState } from "../../lib/vote-utils";
import { VoteType } from "@/types/product";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Enhanced product type with vote data that will be added by the API
// Using a type intersection instead of extends to avoid property requirement issues
type EnhancedProduct = Product & {
  url?: string;
};

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const clientId = searchParams.get('clientId') || getClientId();
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    
    console.log(`API Request: /api/products - Params: ${
      JSON.stringify({
        slug,
        id,
        category,
        clientId: clientId ? `${clientId.slice(0, 5)}...` : null,
        limit
      })
    }`);
    
    // Create a copy of products with valid slugs
    const productsWithValidSlugs = mockProducts.map(product => {
      // Ensure each product has a valid slug
      if (!product.url_slug || !product.url_slug.trim()) {
        const validSlug = getValidProductSlug(product);
        console.log(`Fixed invalid slug for ${product.name}: ${product.url_slug || 'undefined'} -> ${validSlug}`);
        return { ...product, url_slug: validSlug };
      }
      return product;
    });
    
    console.log(`Total products available: ${productsWithValidSlugs.length}`);
    
    // Handle single product request (by slug or id)
    if (slug) {
      const product = productsWithValidSlugs.find(p => p.url_slug === slug);
      
      if (!product) {
        // For better debugging, log available slugs if the product was not found
        const availableSlugs = productsWithValidSlugs.map(p => p.url_slug).filter(Boolean);
        
        return NextResponse.json({
          success: false,
          error: `Product with slug '${slug}' not found`,
          debug: {
            availableSlugs: Array.from(new Set(availableSlugs)).join(', '),
            availableCategories: Array.from(new Set(productsWithValidSlugs.map(p => p.category))).join(', '),
            requestedSlug: slug,
            productCount: productsWithValidSlugs.length
          }
        }, { status: 404 });
      }
      
      // Try to get vote data
      try {
        const voteState = await getVoteState();
        const voteCounts = voteState.voteCounts[product.id] || { upvotes: 0, downvotes: 0 };
        const voteKey = `${product.id}:${clientId}`;
        const voteValue = voteState.votes[voteKey] || null;
        
        const enhancedProduct = {
          ...product,
          upvotes: voteCounts.upvotes || 0,
          downvotes: voteCounts.downvotes || 0,
          userVote: voteValue ? {
            hasVoted: voteValue !== null,
            voteType: voteValue as VoteType
          } : undefined,
          url: createProductUrl(product)
        };
        
        return NextResponse.json({
          success: true,
          product: enhancedProduct
        });
      } catch (error) {
        console.error('Error when fetching vote data:', error);
      }
      
      // Return product without vote data if vote system fails
      return NextResponse.json({
        success: true,
        product: {
          ...product,
          url: createProductUrl(product)
        }
      });
    } else if (id) {
      const product = productsWithValidSlugs.find(p => p.id === id);
      
      if (!product) {
        return NextResponse.json({
          success: false,
          error: `Product with ID '${id}' not found`,
          debug: {
            availableIds: productsWithValidSlugs.map(p => p.id).slice(0, 10).join(', ') + '...',
            requestedId: id
          }
        }, { status: 404 });
      }
      
      // Return the product
      return NextResponse.json({
        success: true,
        product: {
          ...product,
          url: createProductUrl(product)
        }
      });
    }
    
    // Handle filtered products list (by category)
    let filteredProducts = [...productsWithValidSlugs];
    
    if (category) {
      console.log(`Filtering by category: ${category}`);
      filteredProducts = filteredProducts.filter(p => p.category === category);
      console.log(`Found ${filteredProducts.length} products in category ${category}`);
    }
    
    // Apply limit if specified
    if (limit && limit > 0 && limit < filteredProducts.length) {
      filteredProducts = filteredProducts.slice(0, limit);
      console.log(`Limited to ${filteredProducts.length} products`);
    }
    
    // Try to enhance products with vote data
    try {
      const voteState = await getVoteState();
      
      // Enhance products with vote data
      filteredProducts = filteredProducts.map(product => {
        const voteCounts = voteState.voteCounts[product.id] || { upvotes: 0, downvotes: 0 };
        const voteKey = `${product.id}:${clientId}`;
        const voteValue = voteState.votes[voteKey] || null;
        const score = voteCounts.upvotes - voteCounts.downvotes;
        
        return {
          ...product,
          upvotes: voteCounts.upvotes || 0,
          downvotes: voteCounts.downvotes || 0,
          userVote: voteValue ? {
            hasVoted: voteValue !== null,
            voteType: voteValue as VoteType
          } : undefined,
          score,
          url: createProductUrl(product)
        };
      });
      
      // Sort by score (descending)
      filteredProducts.sort((a, b) => (b.score || 0) - (a.score || 0));
    } catch (error) {
      console.error('Error when fetching multiple vote data:', error);
      
      // Ensure all products have proper URLs even if vote system fails
      filteredProducts = filteredProducts.map(product => ({
        ...product,
        url: createProductUrl(product)
      }));
    }
    
    // Return all products (filtered or not)
    return NextResponse.json({
      success: true,
      products: filteredProducts,
      total: filteredProducts.length
    });
    
  } catch (error) {
    console.error('Error in products API:', error);
    return NextResponse.json({
      success: false,
      error: 'An error occurred while fetching products'
    }, { status: 500 });
  }
} 
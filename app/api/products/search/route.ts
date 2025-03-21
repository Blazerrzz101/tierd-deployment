import { NextRequest, NextResponse } from 'next/server'
import { getProductsBySearchTerm } from '@/utils/product-utils'

export async function GET(request: NextRequest) {
  try {
    // Get search query from URL parameters
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    // Validate query
    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Search query must be at least 2 characters' 
        }, 
        { status: 400 }
      )
    }
    
    // Search for products matching the query
    const products = getProductsBySearchTerm(query, category, limit)
    
    // Return the results
    return NextResponse.json({
      success: true,
      products,
      meta: {
        total: products.length,
        query,
        category: category || 'all'
      }
    })
  } catch (error) {
    console.error('Error in products search API:', error)
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while searching for products' 
      }, 
      { status: 500 }
    )
  }
} 
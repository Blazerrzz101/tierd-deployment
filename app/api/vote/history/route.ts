import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// File path for local votes storage
const VOTES_FILE_PATH = path.join(process.cwd(), 'data', 'votes.json')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Types
interface VoteHistoryItem {
  productId: string
  productName: string
  category: string
  voteType: number
  timestamp: string
}

interface LocalVoteState {
  votes: Record<string, number>
  voteCounts: Record<string, { upvotes: number, downvotes: number }>
  lastUpdated: string
  userVotes: Array<{
    productId: string
    clientId: string
    voteType: number
    timestamp: string
  }>
}

/**
 * Read the local vote state from file
 */
function readVotesFile(): LocalVoteState {
  try {
    // Ensure directory exists
    const dir = path.dirname(VOTES_FILE_PATH)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Read file if it exists, otherwise return empty state
    if (fs.existsSync(VOTES_FILE_PATH)) {
      const fileContent = fs.readFileSync(VOTES_FILE_PATH, 'utf-8')
      console.log('Successfully read vote state from:', VOTES_FILE_PATH)
      return JSON.parse(fileContent)
    }
    
    return {
      votes: {},
      voteCounts: {},
      lastUpdated: new Date().toISOString(),
      userVotes: []
    }
  } catch (error) {
    console.error('Error reading votes file:', error)
    return {
      votes: {},
      voteCounts: {},
      lastUpdated: new Date().toISOString(),
      userVotes: []
    }
  }
}

/**
 * Get product details from Supabase by ID
 */
async function getProductDetails(productIds: string[]) {
  try {
    if (!productIds.length) return {}
    
    // Try to get product details from Supabase
    const { data, error } = await supabase
      .from('products')
      .select('id, name, category')
      .in('id', productIds)
    
    if (error) {
      console.error('Error fetching product details:', error)
      return {}
    }
    
    // Create a map of product ID to details
    const productMap: Record<string, { name: string, category: string }> = {}
    data.forEach(product => {
      productMap[product.id] = {
        name: product.name,
        category: product.category
      }
    })
    
    return productMap
  } catch (error) {
    console.error('Error in getProductDetails:', error)
    return {}
  }
}

/**
 * GET handler to retrieve vote history
 */
export async function GET(request: NextRequest) {
  try {
    const clientId = request.nextUrl.searchParams.get('clientId')
    
    if (!clientId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Client ID is required' 
      }, { status: 400 })
    }
    
    // Read votes from local file
    const voteState = readVotesFile()
    
    // Filter votes by client ID
    const userVotes = voteState.userVotes.filter(vote => vote.clientId === clientId)
    
    // Get unique product IDs
    const productIds = Array.from(new Set(userVotes.map(vote => vote.productId)))
    
    // Try to get product details from Supabase
    const productDetails = await getProductDetails(productIds)
    
    // Mock product details if we couldn't get them from Supabase
    const mockProductMap: Record<string, { name: string, category: string }> = {}
    productIds.forEach(id => {
      if (!productDetails[id]) {
        // Create a mock product name if we don't have real details
        mockProductMap[id] = {
          name: id.includes('-') ? 
            `Product ${id.split('-')[0]}` :
            `Product ${id.substring(0, 8)}`,
          category: 'Unknown'
        }
      }
    })
    
    // Combine real and mock product details
    const allProductDetails = { ...mockProductMap, ...productDetails }
    
    // Create vote history with product names
    const voteHistory: VoteHistoryItem[] = userVotes
      .map(vote => ({
        productId: vote.productId,
        productName: allProductDetails[vote.productId]?.name || vote.productId,
        category: allProductDetails[vote.productId]?.category || 'Unknown',
        voteType: vote.voteType,
        timestamp: vote.timestamp
      }))
      // Sort by timestamp, newest first
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    return NextResponse.json({
      success: true,
      votes: voteHistory
    })
  } catch (error) {
    console.error('Error in vote history API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
} 
"use client"

import { Product, Review, VoteType } from "@/types"
import { supabase } from "@/lib/supabase/client"

interface Vote {
  id: string;
  product_id: string;
  user_id: string;
  vote_type: number;
  created_at: string;
  updated_at: string;
}

interface Rankings {
  id: string;
  name: string;
  description: string;
  image_url: string;
  price: number;
  category: string;
  slug: string;
  upvotes: number;
  downvotes: number;
  rating: number;
  review_count: number;
  net_score: number;
  rank: number;
}

interface ProductWithVotes {
  upvotes?: number;
  downvotes?: number;
  last_vote_timestamp?: string;
  reviews?: Review[];
}

// Constants for ranking calculations
const RANKING_WEIGHTS = {
  WILSON_SCORE: 0.6,
  REVIEW_SCORE: 0.2,
  RECENT_ACTIVITY: 0.15,
  CONTROVERSY_PENALTY: 0.05
} as const;

const TIME_WINDOWS = {
  RECENT_VOTES: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  REVIEW_DECAY: 30 * 24 * 60 * 60 * 1000 // 30 days in milliseconds
} as const;

// Calculate Wilson score for vote confidence
function calculateWilsonScore(upvotes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0
  
  const z = 1.96 // 95% confidence
  const p = upvotes / totalVotes
  
  const left = p + z * z / (2 * totalVotes)
  const right = z * Math.sqrt((p * (1 - p) + z * z / (4 * totalVotes)) / totalVotes)
  const under = 1 + z * z / totalVotes
  
  return (left - right) / under
}

// Calculate review score with time decay
function calculateReviewScore(reviews: Review[]): number {
  if (!reviews || reviews.length === 0) return 0

  const now = Date.now()
  return reviews.reduce((score, review) => {
    const age = now - new Date(review.created_at).getTime()
    const decay = Math.exp(-age / TIME_WINDOWS.REVIEW_DECAY)
    return score + (review.rating / 5) * decay
  }, 0) / reviews.length
}

// Calculate recent activity score
function calculateRecentActivity(product: ProductWithVotes): number {
  const now = Date.now()
  const lastVoteTime = product.last_vote_timestamp ? new Date(product.last_vote_timestamp).getTime() : 0
  const lastVoteAge = now - lastVoteTime
  
  // Count recent votes
  const totalVotes = (product.upvotes || 0) + (product.downvotes || 0)
  const recentVotes = lastVoteAge < TIME_WINDOWS.RECENT_VOTES ? totalVotes : 0
  
  // Count recent reviews
  const recentReviews = (product.reviews || []).filter(review =>
    now - new Date(review.created_at).getTime() < TIME_WINDOWS.RECENT_VOTES
  ).length
  
  return (recentVotes + recentReviews * 2) / 100 // Normalize to 0-1 range
}

// Calculate controversy score
function calculateControversyScore(upvotes: number, downvotes: number): number {
  const totalVotes = upvotes + downvotes
  if (totalVotes === 0) return 0
  return Math.abs(upvotes - downvotes) / totalVotes
}

// Refresh the materialized view
async function refreshRankings(): Promise<void> {
  try {
    await supabase.rpc('refresh_product_rankings')
  } catch (error) {
    console.error('Error refreshing product rankings:', error)
    throw new Error('Failed to refresh product rankings')
  }
}

// Cast a vote on a product
export async function castVote(productId: string, voteType: VoteType): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('User must be authenticated to vote')

    // Convert vote type to numeric value for database
    const voteValue = voteType === 'up' ? 1 : -1

    // Insert or update the vote
    const { error: voteError } = await supabase
      .from('votes')
      .upsert({
        product_id: productId,
        user_id: user.id,
        vote_type: voteValue,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'product_id,user_id'
      })

    if (voteError) throw voteError

    // Refresh the materialized view
    await refreshRankings()

  } catch (error) {
    console.error('Error casting vote:', error)
    throw error
  }
}

// Get product with rankings
export async function getProductWithRankings(productId: string): Promise<Product | null> {
  try {
    // Get product data including rankings
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select(`
        *,
        reviews (*),
        product_rankings!inner (
          id,
          name,
          description,
          image_url,
          price,
          category,
          slug,
          upvotes,
          downvotes,
          rating,
          review_count,
          net_score,
          rank
        )
      `)
      .eq('id', productId)
      .single()

    if (productError) throw productError
    if (!productData) return null

    // Get user's vote if logged in
    const { data: { user } } = await supabase.auth.getUser()
    let userVote: VoteType | null = null

    if (user) {
      const { data: vote } = await supabase
        .from('votes')
        .select('vote_type')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single()

      if (vote) {
        const dbVote = vote as Vote
        userVote = dbVote.vote_type === 1 ? 'up' : 'down'
      }
    }

    const rankings = productData.product_rankings as Rankings
    
    // Construct the full product object with rankings
    const product: Product = {
      ...productData,
      userVote,
      score: rankings.net_score,
      rank: rankings.rank,
      upvotes: rankings.upvotes,
      downvotes: rankings.downvotes,
      rating: rankings.rating,
      review_count: rankings.review_count,
      neutral_votes: 0, // We don't track neutral votes anymore
      controversy_score: calculateControversyScore(rankings.upvotes, rankings.downvotes),
      last_vote_timestamp: new Date().toISOString(), // Updated whenever rankings are refreshed
      reviews: productData.reviews || []
    } as Product

    return product

  } catch (error) {
    console.error('Error getting product with rankings:', error)
    return null
  }
}

// Get all ranked products
export async function getAllRankedProducts(): Promise<Product[]> {
  try {
    // Get all products with their rankings
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        *,
        reviews (*),
        product_rankings!inner (
          id,
          name,
          description,
          image_url,
          price,
          category,
          slug,
          upvotes,
          downvotes,
          rating,
          review_count,
          net_score,
          rank
        )
      `)
      .order('rank', { foreignTable: 'product_rankings' })

    if (productsError) throw productsError
    if (!productsData) return []

    // Get current user's votes if logged in
    const { data: { user } } = await supabase.auth.getUser()
    let userVotes: Record<string, VoteType> = {}

    if (user) {
      const { data: votes } = await supabase
        .from('votes')
        .select('product_id, vote_type')
        .eq('user_id', user.id)

      if (votes) {
        userVotes = votes.reduce((acc, vote) => ({
          ...acc,
          [vote.product_id]: vote.vote_type === 1 ? 'up' : 'down'
        }), {})
      }
    }

    // Construct the full product objects with rankings
    return productsData.map(productData => {
      const rankings = productData.product_rankings as Rankings
      
      return {
        ...productData,
        userVote: userVotes[productData.id] || null,
        score: rankings.net_score,
        rank: rankings.rank,
        upvotes: rankings.upvotes,
        downvotes: rankings.downvotes,
        rating: rankings.rating,
        review_count: rankings.review_count,
        neutral_votes: 0,
        controversy_score: calculateControversyScore(rankings.upvotes, rankings.downvotes),
        last_vote_timestamp: new Date().toISOString(),
        reviews: productData.reviews || []
      } as Product
    })

  } catch (error) {
    console.error('Error getting ranked products:', error)
    return []
  }
}
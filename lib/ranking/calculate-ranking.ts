import { Product } from '@/types/product'

/**
 * Calculate the ranking score for a product
 * This should match the calculation in the database materialized view
 */
export function calculateRankingScore(product: Product): number {
  const voteScore = product.upvotes - product.downvotes
  const reviewScore = product.rating * product.review_count
  
  // Weight votes more heavily than reviews (70% votes, 30% reviews)
  return (voteScore * 0.7) + (reviewScore * 0.3)
}

/**
 * Calculate the controversy score for a product
 * Higher scores indicate more controversial products (similar numbers of up/down votes)
 */
export function calculateControversyScore(product: Product): number {
  const totalVotes = product.upvotes + product.downvotes
  if (totalVotes === 0) return 0
  
  const upvoteRatio = product.upvotes / totalVotes
  const downvoteRatio = product.downvotes / totalVotes
  
  // Score is highest when upvotes and downvotes are equal
  return 1 - Math.abs(upvoteRatio - downvoteRatio)
}

/**
 * Sort products by their ranking score
 */
export function sortProductsByRank(products: Product[]): Product[] {
  return [...products].sort((a, b) => {
    const scoreA = calculateRankingScore(a)
    const scoreB = calculateRankingScore(b)
    
    if (scoreA === scoreB) {
      // If scores are equal, newer products rank higher
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    
    return scoreB - scoreA
  })
}

/**
 * Update product rankings in a list
 * This should be called after any vote changes
 */
export function updateProductRankings(products: Product[]): Product[] {
  const sortedProducts = sortProductsByRank(products)
  
  return sortedProducts.map((product, index) => ({
    ...product,
    rank: index + 1
  }))
} 
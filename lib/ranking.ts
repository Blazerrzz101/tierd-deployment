"use client"

import { Product, VoteType } from "@/types"

// Wilson score interval for ranking
// https://www.evanmiller.org/how-not-to-sort-by-average-rating.html
function wilsonScore(upvotes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0
  
  const z = 1.96 // 95% confidence
  const p = upvotes / totalVotes
  
  const left = p + z * z / (2 * totalVotes)
  const right = z * Math.sqrt((p * (1 - p) + z * z / (4 * totalVotes)) / totalVotes)
  const under = 1 + z * z / totalVotes
  
  return (left - right) / under
}

// Calculate rank changes over time
function calculateTrending(product: Product, timeWindow: number = 7): number {
  // In a real app, we'd track vote history with timestamps
  // For now, use a simplified trending score
  const recentVotes = product.votes * 0.3 // Assume 30% are recent
  return recentVotes / timeWindow
}

// Main ranking algorithm
export function calculateRankings(products: Product[], category?: string): Product[] {
  let rankedProducts = [...products]
  
  if (category) {
    rankedProducts = rankedProducts.filter(p => p.category === category)
  }

  // Calculate scores
  const productsWithScores = rankedProducts.map(product => {
    const upvotes = product.votes
    const downvotes = Math.floor(product.votes * 0.2) // Simplified for demo
    const totalVotes = upvotes + downvotes
    
    const score = wilsonScore(upvotes, totalVotes)
    const trending = calculateTrending(product)
    
    return {
      ...product,
      score: score + (trending * 0.1) // Add trending bonus
    }
  })

  // Sort by score and assign ranks
  return productsWithScores
    .sort((a, b) => b.score - a.score)
    .map((product, index) => ({
      ...product,
      rank: index + 1
    }))
}

// Update product rankings after vote
export function updateRankings(
  products: Product[],
  productId: string,
  voteType: VoteType,
  previousVote: VoteType | null
): Product[] {
  // Update the voted product
  const updatedProducts = products.map(product => {
    if (product.id !== productId) return product

    let voteChange = 0
    if (previousVote === "up") voteChange--
    if (previousVote === "down") voteChange++
    if (voteType === "up") voteChange++
    if (voteType === "down") voteChange--

    return {
      ...product,
      votes: product.votes + voteChange,
      userVote: voteType
    }
  })

  // Recalculate all rankings
  return calculateRankings(updatedProducts)
}
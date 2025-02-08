"use client"

import { Product, VoteType } from "@/lib/types/product"

// Wilson score interval for ranking
function calculateWilsonScore(upvotes: number, totalVotes: number): number {
  if (totalVotes === 0) return 0
  
  const z = 1.96 // 95% confidence
  const p = upvotes / totalVotes
  
  const left = p + z * z / (2 * totalVotes)
  const right = z * Math.sqrt((p * (1 - p) + z * z / (4 * totalVotes)) / totalVotes)
  const under = 1 + z * z / totalVotes
  
  return (left - right) / under
}

// Calculate trending score based on recent votes
function calculateTrendingScore(product: Product): number {
  if (!product.lastVoteTimestamp) return 0
  
  const now = Date.now()
  const hoursSinceLastVote = (now - product.lastVoteTimestamp) / (1000 * 60 * 60)
  const decay = 1 / (1 + Math.log(1 + hoursSinceLastVote))
  
  return decay * product.votes
}

// Main ranking algorithm
export function calculateRankings(products: Product[]): Product[] {
  return products
    .map(product => {
      const trendingScore = calculateTrendingScore(product)
      const wilsonScore = calculateWilsonScore(product.votes, product.votes) // Simplified for demo
      const finalScore = wilsonScore + (trendingScore * 0.1)
      
      return {
        ...product,
        score: finalScore
      }
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .map((product, index) => ({
      ...product,
      rank: index + 1
    }))
}

// Update rankings after a vote
export function updateRankings(
  products: Product[],
  productId: string,
  voteType: VoteType,
  previousVote: VoteType | null
): Product[] {
  const updatedProducts = products.map(product => {
    if (product.id !== productId) return product

    let voteChange = 0
    if (previousVote === "up") voteChange--
    if (previousVote === "down") voteChange++
    if (voteType === "up") voteChange++
    if (voteType === "down") voteChange--

    return {
      ...product,
      votes: Math.max(0, product.votes + voteChange),
      userVote: voteType,
      lastVoteTimestamp: Date.now()
    }
  })

  return calculateRankings(updatedProducts)
}
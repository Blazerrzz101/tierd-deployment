"use client"

import { Product, VoteType } from "@/types"

// Calculate score using a modified Wilson score interval
function calculateScore(upvotes: number, downvotes: number): number {
  const n = upvotes + downvotes
  if (n === 0) return 0

  const z = 1.96 // 95% confidence
  const p = upvotes / n
  
  const left = p + z * z / (2 * n)
  const right = z * Math.sqrt((p * (1 - p) + z * z / (4 * n)) / n)
  const under = 1 + z * z / n
  
  return (left - right) / under
}

// Calculate time decay factor (for trending products)
function calculateTimeDecay(timestamp: number): number {
  const now = Date.now()
  const hoursSinceVote = (now - timestamp) / (1000 * 60 * 60)
  return 1 / (1 + Math.log(1 + hoursSinceVote))
}

// Main ranking algorithm
export function calculateRankings(products: Product[]): Product[] {
  return products
    .map(product => {
      // For beta testing, treat all votes as recent
      const timeDecay = calculateTimeDecay(Date.now())
      const score = calculateScore(product.votes, 0) * timeDecay
      
      return {
        ...product,
        score
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
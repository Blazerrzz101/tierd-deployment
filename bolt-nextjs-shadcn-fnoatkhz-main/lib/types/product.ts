"use client"

export interface Product {
  id: string
  name: string
  category: string
  description: string
  imageUrl: string
  votes: number
  rank: number
  price: number
  userVote?: 'up' | 'down' | null
  specs: Record<string, string>
  lastVoteTimestamp?: number
}

export interface ProductStats {
  upvotes: number
  downvotes: number
  totalVotes: number
  activeUsers: number
  lastUpdated: number
}

export type VoteType = 'up' | 'down' | null
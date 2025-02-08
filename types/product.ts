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
  url_slug: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
}

export type VoteType = 'up' | 'down' | null

export interface ProductWithVotes extends Product {
  upvotes: number
  downvotes: number
  last_vote_timestamp?: string
}
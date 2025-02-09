"use client"

export interface Product {
  id: string
  name: string
  description: string | null
  category: string
  price: number | null
  image_url: string | null
  url_slug: string
  created_at: string
  updated_at: string
  rank?: number
  votes?: number
  userVote?: 'up' | 'down' | null
  specs?: Record<string, unknown>
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